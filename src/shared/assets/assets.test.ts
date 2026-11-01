// 다람쥐, 로고, 파비콘 경로가 public/의 실제 파일을 가리키는지 확인한다.

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

import { BRAND, MASCOT_IMAGES } from '.';

test('모든 이미지 경로에 파일이 있다', () => {
  const paths = [...Object.values(MASCOT_IMAGES), BRAND.favicon, BRAND.appleIcon, ...(BRAND.logo ? [BRAND.logo] : [])];
  for (const src of paths) assert.ok(existsSync(path.join('public', src)), `${src} 파일이 없다`);
});
