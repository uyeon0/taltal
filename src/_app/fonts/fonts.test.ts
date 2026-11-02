// 낭만있구미체의 unicode-range가 실제로 그려진 한글만 가리키는지, 서버 이미지용 글꼴 파일이 있는지 확인한다.
// 빈 글자가 범위에 들어가면 제목에 공백이 생기고, 그린 글자가 빠지면 SUIT로 섞여 보인다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

import { SITE } from '@/shared/config/site';

const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;

function hangulInRange(range: string): Set<number> {
  const codes = new Set<number>();
  for (const part of range.split(',')) {
    const [start, end = start] = part.trim().replace(/^U\+/, '').split('-');
    for (let code = parseInt(start, 16); code <= parseInt(end, 16); code++) {
      if (code >= HANGUL_FIRST && code <= HANGUL_LAST) codes.add(code);
    }
  }
  return codes;
}

test('unicode-range의 한글 음절이 지원 글자 목록과 같다', () => {
  const source = readFileSync('src/_app/fonts/index.ts', 'utf8');
  const range = source.match(/prop: 'unicode-range',\s*value:\s*'([^']+)'/);
  assert.ok(range, 'unicode-range 선언을 찾지 못했다');

  const drawn = new Set(
    [...readFileSync('src/_app/fonts/gumi-romance-hangul.txt', 'utf8').trim()].map((char) => char.codePointAt(0)!)
  );
  const declared = hangulInRange(range[1]);

  const missing = [...drawn].filter((code) => !declared.has(code)).map((code) => String.fromCodePoint(code));
  const extra = [...declared].filter((code) => !drawn.has(code)).map((code) => String.fromCodePoint(code));
  assert.deepEqual(missing, [], '그린 글자가 범위에서 빠졌다');
  assert.deepEqual(extra, [], '빈 글자가 범위에 들어 있다');
});

test('이미지용 글꼴 파일이 있고, 서비스 이름은 낭만있구미체가 그린 글자로만 되어 있다', () => {
  for (const file of [
    'SUIT-Regular.otf',
    'SUIT-Medium.otf',
    'SUIT-SemiBold.otf',
    'SUIT-Bold.otf',
    'GumiRomance-Regular.otf'
  ]) {
    assert.ok(existsSync(`src/_app/fonts/image/${file}`), `${file} 파일이 없다`);
  }
  const drawn = new Set(readFileSync('src/_app/fonts/gumi-romance-hangul.txt', 'utf8').trim());
  const hangul = [...SITE.name].filter((char) => char >= '가' && char <= '힣');
  assert.deepEqual(
    hangul.filter((char) => !drawn.has(char)),
    [],
    '서비스 이름에 낭만있구미체가 그리지 않은 글자가 있다'
  );
});
