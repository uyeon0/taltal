// @vitest-environment jsdom
// 웹의 방문 쿠키와 미니앱의 방문 시각 보관 기간을 확인한다.

import assert from 'node:assert/strict';
import { test, vi } from 'vitest';

import { VISIT_COOKIE } from '@/shared/config';

import { isRecentVisit, markVisited } from './visit';

test('웹에서는 방문 쿠키를 3일 보관, 사이트 전체 경로로 쓴다', async () => {
  const written: string[] = [];
  vi.spyOn(document, 'cookie', 'set').mockImplementation((value: string) => {
    written.push(value);
  });

  await markVisited();

  assert.equal(written.length, 1);
  assert.match(written[0], new RegExp(`^${VISIT_COOKIE.name}=1;`));
  assert.match(written[0], /Max-Age=259200;/);
  assert.match(written[0], /Path=\//);
  assert.match(written[0], /SameSite=Lax/);
});

test('저장한 방문 시각이 3일 안이면 최근 방문이다', () => {
  const now = Date.UTC(2026, 0, 10);
  const day = 24 * 60 * 60 * 1000;
  assert.equal(isRecentVisit(String(now - 2 * day), now), true);
  assert.equal(isRecentVisit(String(now - 3 * day), now), false);
  assert.equal(isRecentVisit(null, now), false);
  assert.equal(isRecentVisit('', now), false);
  assert.equal(isRecentVisit('방문', now), false);
});
