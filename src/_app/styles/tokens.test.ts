// 전역 CSS의 토큰이 기준 파일(docs/tokens.css)과 같은지 확인한다. 한쪽만 고치면 디자인 값이 어긋나기 때문이다.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

// 앱은 첫 글꼴을 next/font 변수로 바꾸므로 이 두 값은 기준과 다르다
const APP_ONLY = new Set(['--font-family-sans', '--font-family-display']);

function rootVariables(css: string): Map<string, string> {
  const root = css.match(/:root \{([\s\S]*?)\n\}/);
  assert.ok(root, ':root 블록이 없다');
  const vars = new Map<string, string>();
  for (const [, name, value] of root[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars.set(name, value.trim());
  return vars;
}

test('전역 CSS의 :root 변수가 docs/tokens.css와 같다', () => {
  const expected = rootVariables(readFileSync('docs/tokens.css', 'utf8'));
  const actual = rootVariables(readFileSync('src/_app/styles/globals.css', 'utf8'));

  for (const [name, value] of expected) {
    assert.ok(actual.has(name), `${name}이 전역 CSS에 없다`);
    if (!APP_ONLY.has(name)) assert.equal(actual.get(name), value, `${name}의 값이 기준과 다르다`);
  }
  for (const name of actual.keys()) assert.ok(expected.has(name), `${name}은 docs/tokens.css에 없다`);
});
