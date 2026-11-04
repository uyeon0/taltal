// 미니앱 출처에만 CORS 헤더를 붙이는지 확인한다. 오류 응답과 사전 요청에도 붙어야 한다.

import assert from 'node:assert/strict';
import { test } from 'vitest';

import { POST, OPTIONS } from './candidates';

const MINIAPP = 'https://taltal.apps.tossmini.com';
const QR_TEST = 'https://taltal.private-apps.tossmini.com';

const post = (origin?: string) =>
  POST(
    new Request('http://localhost/api/candidates', {
      method: 'POST',
      headers: origin ? { Origin: origin } : {},
      body: JSON.stringify({ servings: 2 })
    })
  );

test('미니앱 운영 주소와 QR 테스트 주소에는 출처를 그대로 허용한다. 400 응답에도 붙인다', async () => {
  for (const origin of [MINIAPP, QR_TEST]) {
    const res = await post(origin);
    assert.equal(res.status, 400);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), origin);
    assert.match(res.headers.get('Vary') ?? '', /Origin/);
  }
});

test('다른 출처와 같은 출처 요청에는 CORS 헤더를 붙이지 않는다', async () => {
  for (const origin of ['https://evil.example', 'https://other.apps.tossmini.com', undefined]) {
    const res = await post(origin);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), null, String(origin));
  }
});

test('사전 요청에 허용 메서드와 헤더를 답한다', async () => {
  const res = await OPTIONS(
    new Request('http://localhost/api/candidates', {
      method: 'OPTIONS',
      headers: { Origin: MINIAPP, 'Access-Control-Request-Method': 'POST' }
    })
  );
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), MINIAPP);
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
  assert.equal(res.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
});
