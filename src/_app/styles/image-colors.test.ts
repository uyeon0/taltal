// 서버 이미지가 전역 CSS의 토큰에서 색을 꺼내는지 확인한다.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import { readImageColors } from './image-colors.server';

test('전역 CSS의 :root 토큰에서 이미지 색을 꺼낸다', () => {
  const css = readFileSync('src/_app/styles/globals.css', 'utf8');
  const root = css.match(/:root \{([\s\S]*?)\n\}/)![1];
  const token = (name: string) => root.match(new RegExp(`${name}:\\s*([^;]+);`))![1].trim();

  assert.deepEqual(readImageColors(css), {
    brand: token('--primary'),
    ink: token('--foreground'),
    light: token('--card'),
    subtle: token('--border')
  });
});

test('토큰이 없으면 오류를 던진다', () => {
  assert.throws(() => readImageColors(':root {\n  --primary: red;\n}'), /--foreground/);
});
