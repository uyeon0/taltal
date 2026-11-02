// 코드에 docs/design.md의 값과 다른 임의 색, 간격, 라운딩, 그림자, 투명도가 없는지 확인한다.
// 디자인 값은 전역 CSS의 토큰과 Tailwind 클래스로만 쓴다.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

const ROOTS = ['src', 'app'];
// 스크립트가 만든 파일과 테스트는 검사하지 않는다
const SKIP = [/\.test\.tsx?$/, /ingredient-images\.ts$/, /__fixtures__/];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!/\.tsx?$/.test(entry.name) || SKIP.some((pattern) => pattern.test(full))) return [];
    return [full];
  });
}

// 간격은 4, 8, 12, 16, 24, 32, 48px만 쓴다(Tailwind 숫자 1, 2, 3, 4, 6, 8, 12)
const SPACING_UTILITIES =
  'p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|bottom|left|right';
const ALLOWED_SPACING = new Set(['0', '1', '2', '3', '4', '6', '8', '12']);

const RULES: { name: string; pattern: RegExp; allow?: (match: RegExpMatchArray) => boolean }[] = [
  { name: 'HEX 색', pattern: /#[0-9a-fA-F]{3,8}\b/g },
  // 임의 값(p-[13px])만 막는다. 임의 변형(data-[state=on]:, [&_svg]:)은 값이 아니다
  { name: 'Tailwind 임의 값', pattern: /\b[a-z][\w-]*-\[[^\]\s]+\](?!:)/g },
  {
    name: '투명도 수식어',
    pattern: /\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|shadow)-[a-z][\w-]*\/\d+\b/g
  },
  { name: '투명도 클래스', pattern: /\bopacity-\d+\b/g },
  { name: '그림자 클래스', pattern: /\b(?:shadow|drop-shadow)-(?!none\b)[\w-]+/g },
  { name: '그림자 클래스', pattern: /\bshadow(?=["'\s])/g },
  {
    name: '허용하지 않은 간격',
    pattern: new RegExp(`(?<![\\w-])-?(?:${SPACING_UTILITIES})-(\\d+(?:\\.\\d+)?)\\b(?![/.])`, 'g'),
    allow: (match) => ALLOWED_SPACING.has(match[1])
  },
  { name: '허용하지 않은 라운딩', pattern: /\brounded(?:-[trbl]{1,2})?-(?:xs|3xl|4xl)\b/g }
];

test('코드에 디자인 기준 밖의 값이 없다', () => {
  const problems: string[] = [];
  for (const file of ROOTS.flatMap(sourceFiles)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // 주석은 검사하지 않는다
      for (const rule of RULES) {
        for (const match of line.matchAll(rule.pattern)) {
          if (rule.allow?.(match)) continue;
          problems.push(`${file}:${index + 1} ${rule.name} "${match[0]}"`);
        }
      }
    });
  }
  assert.deepEqual(problems, []);
});
