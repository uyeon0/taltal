// @vitest-environment jsdom
// 방문 쿠키를 3일 보관으로 쓰는지 확인한다.

import assert from 'node:assert/strict';
import { test, vi } from 'vitest';

import { VISIT_COOKIE } from '@/shared/config';

import { markVisited } from './visit';

test('방문 쿠키를 3일 보관, 사이트 전체 경로로 쓴다', () => {
  const written: string[] = [];
  vi.spyOn(document, 'cookie', 'set').mockImplementation((value: string) => {
    written.push(value);
  });

  markVisited();

  assert.equal(written.length, 1);
  assert.match(written[0], new RegExp(`^${VISIT_COOKIE.name}=1;`));
  assert.match(written[0], /Max-Age=259200;/);
  assert.match(written[0], /Path=\//);
  assert.match(written[0], /SameSite=Lax/);
});
