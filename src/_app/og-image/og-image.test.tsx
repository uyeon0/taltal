import assert from 'node:assert/strict';
import { test } from 'vitest';

import { SITE } from '@/shared/config/site';

import OgImage, { alt, contentType, size } from './og-image';

test('공유 이미지는 1200×630 PNG다', { timeout: 30_000 }, async () => {
  const res = await OgImage();
  const png = Buffer.from(await res.arrayBuffer());

  assert.equal(contentType, 'image/png');
  assert.equal(png.toString('latin1', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), size.width);
  assert.equal(png.readUInt32BE(20), size.height);
  assert.deepEqual(size, { width: 1200, height: 630 });
});

test('대체 텍스트에 서비스 이름과 한 줄 설명이 있다', () => {
  assert.ok(alt.includes(SITE.name));
  assert.ok(alt.includes(SITE.description));
});
