// 후보 요청 검사. 형식이나 크기가 틀린 요청은 데이터를 읽기 전에 400으로 막는다.

import assert from 'node:assert/strict';
import { test } from 'vitest';

import { POST } from './candidates';

const call = (body: unknown) =>
  POST(new Request('http://localhost/api/candidates', { method: 'POST', body: JSON.stringify(body) }));

test('형식이 틀리거나 너무 큰 요청은 400이다', async () => {
  const item = { ingredientId: '대파', grams: 100 };
  const cases: [string, unknown][] = [
    ['inventory 없음', { servings: 2 }],
    ['음수 g', { inventory: [{ ...item, grams: -1 }], servings: 2 }],
    ['servings 범위 밖', { inventory: [item], servings: 11 }],
    ['재료가 너무 많음', { inventory: Array.from({ length: 201 }, () => item), servings: 2 }],
    ['재료 이름이 너무 김', { inventory: [{ ...item, ingredientId: '가'.repeat(51) }], servings: 2 }]
  ];
  for (const [name, body] of cases) assert.equal((await call(body)).status, 400, name);
});

test('본문이 32KB를 넘으면 JSON을 읽지 않고 400이다', async () => {
  const body = JSON.stringify({ inventory: [], servings: 2, padding: 'x'.repeat(40 * 1024) });
  const res = await POST(new Request('http://localhost/api/candidates', { method: 'POST', body }));
  assert.equal(res.status, 400);
});

test('재료 하나의 g이 상한을 넘으면 400이다', async () => {
  const res = await call({ inventory: [{ ingredientId: '대파', grams: 1e308 }], servings: 2 });
  assert.equal(res.status, 400);
});
