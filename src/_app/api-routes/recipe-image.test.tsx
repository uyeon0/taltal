// 레시피 이미지 요청 검사와, 실제 데이터가 있을 때 그린 PNG와 글자를 확인한다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { ImageResponse } from 'next/og';
import { test, vi } from 'vitest';

import { appDataPath } from '@/shared/db';
import { toImageText } from '@/widgets/recipe-detail-sheet/index.server';

import { loadSuitFonts } from '../fonts/image-fonts.server';
import { POST } from './recipe-image';

const call = (id: string, body: unknown) =>
  POST(new Request(`http://localhost/api/recipes/${id}/image`, { method: 'POST', body: JSON.stringify(body) }), {
    params: Promise.resolve({ id })
  });

const body = { day: 1, uses: [], toBuy: [], shoppingList: [], units: {} };

test('숫자만으로 된 번호가 아니면 400이다', async () => {
  for (const id of ['0x10', '1e1', '007', 'abc']) assert.equal((await call(id, body)).status, 400, id);
});

test('형식이 틀리거나 너무 큰 본문은 400이다', async () => {
  const use = { ingredientId: '대파', grams: 100 };
  const cases: [string, unknown][] = [
    ['본문 없음', null],
    ['day 범위 밖', { ...body, day: 6 }],
    ['day가 정수가 아님', { ...body, day: 1.5 }],
    ['음수 g', { ...body, uses: [{ ...use, grams: -1 }] }],
    ['g 상한 초과', { ...body, uses: [{ ...use, grams: 1e308 }] }],
    ['재료가 너무 많음', { ...body, uses: Array.from({ length: 101 }, () => use) }],
    ['재료 이름이 너무 김', { ...body, toBuy: ['가'.repeat(51)] }],
    ['optional이 불리언이 아님', { ...body, shoppingList: [{ ...use, optional: 'yes' }] }],
    ['없는 단위', { ...body, units: { 대파: '그릇' } }],
    ['units가 배열', { ...body, units: [] }]
  ];
  for (const [name, b] of cases) assert.equal((await call('1', b)).status, 400, name);
});

const recipesFile = appDataPath('recipes.json');
const recipes: { id: number; ingredients: { ingredientId: string; grams: number | null }[] }[] = existsSync(recipesFile)
  ? JSON.parse(readFileSync(recipesFile, 'utf-8'))
  : [];
const dataTest = test.skipIf(recipes.length === 0);

dataTest('없는 레시피는 404다', async () => {
  const missing = Math.max(...recipes.map((r) => r.id)) + 1;
  assert.equal((await call(String(missing), body)).status, 404);
});

dataTest('레시피를 가로 1080px PNG로 그린다', { timeout: 30_000 }, async () => {
  const recipe = recipes[0];
  const uses = recipe.ingredients
    .filter((i) => i.grams !== null)
    .map((i) => ({ ingredientId: i.ingredientId, grams: i.grams! }));
  const res = await call(String(recipe.id), { ...body, uses });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/png');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const png = Buffer.from(await res.arrayBuffer());
  // PNG 서명과 IHDR의 가로
  assert.equal(png.toString('latin1', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 1080);
  assert.ok(png.readUInt32BE(20) > 1000);
});

dataTest('데이터의 모든 글자를 SUIT로 그려 글꼴을 내려받으려 하지 않는다', { timeout: 30_000 }, async () => {
  // 글자가 SUIT에 없으면 ImageResponse가 Google Fonts에서 글꼴을 받으려고 fetch를 부른다
  const fetchSpy = vi.fn(() => Promise.reject(new Error('글꼴을 내려받으려 했다')));
  vi.stubGlobal('fetch', fetchSpy);
  try {
    const text = ['recipes.json', 'recipe-steps.json', 'ingredients.json']
      .map((file) => readFileSync(appDataPath(file), 'utf-8'))
      .join('');
    const chars = [...new Set(toImageText(text))].filter((char) => !/\s/.test(char)).join('');
    const image = new ImageResponse(
      <div style={{ display: 'flex', flexWrap: 'wrap', fontFamily: 'SUIT' }}>{chars}</div>,
      { width: 1080, height: undefined, fonts: await loadSuitFonts() }
    );
    await image.arrayBuffer();
    assert.equal(fetchSpy.mock.calls.length, 0);
  } finally {
    vi.unstubAllGlobals();
  }
});
