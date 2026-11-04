// 첫 방문은 소개로 보내고, 방문 쿠키가 있으면 시작 홈을 그대로 보여 주는지 확인한다.

import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { test } from 'vitest';

import { VISIT_COOKIE } from '@/shared/config';

import { config, proxy } from './proxy.web';

test('방문 쿠키가 없으면 /intro로 보낸다', () => {
  const response = proxy(new NextRequest('https://example.com/'));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://example.com/intro');
});

test('방문 쿠키가 있으면 통과시킨다', () => {
  const request = new NextRequest('https://example.com/', { headers: { cookie: `${VISIT_COOKIE.name}=1` } });
  const response = proxy(request);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('x-middleware-next'), '1');
});

test('시작 홈 주소에서만 동작한다', () => {
  assert.equal(config.matcher, '/');
});

test('첫 방문을 보낼 때 쿼리를 그대로 넘긴다', () => {
  const response = proxy(new NextRequest('https://example.com/?utm_source=slack'));
  assert.equal(response.headers.get('location'), 'https://example.com/intro?utm_source=slack');
});

test('시트 상태는 소개로 넘기지 않고 다른 쿼리는 남긴다', () => {
  const response = proxy(new NextRequest('https://example.com/?sheet=ingredients&utm_source=slack'));
  assert.equal(response.headers.get('location'), 'https://example.com/intro?utm_source=slack');
});
