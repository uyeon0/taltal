import assert from 'node:assert/strict';
import { afterEach, test, vi } from 'vitest';

import { fakeBaskets, fakeIngredients, fakeRecipes } from '../model/__fixtures__/fake-data';
import { filterCandidates } from '../model/filter-candidates.server';
import { searchMeals } from './search-meals';

afterEach(() => {
  vi.unstubAllGlobals();
});

const basket = Object.values(fakeBaskets)[0];

function stubCandidates() {
  const fetchMock = vi.fn(async () => Response.json({ candidates: filterCandidates(fakeRecipes, basket, 2) }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

test('Worker가 없으면 후보를 받아 바로 두 묶음을 계산한다', async () => {
  const fetchMock = stubCandidates();
  const search = await searchMeals(basket, 2, fakeIngredients);
  assert.equal(fetchMock.mock.calls.length, 1);
  assert.ok(search.candidates.length > 0);
  assert.ok('noBuy' in search.options && 'buy' in search.options);
});

test('멈추면 AbortError로 거절한다', async () => {
  stubCandidates();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(searchMeals(basket, 2, fakeIngredients, controller.signal), { name: 'AbortError' });
});

test('후보 요청이 실패하면 오류로 거절한다', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ error: '서버 오류' }, { status: 500 }))
  );
  await assert.rejects(searchMeals(basket, 2, fakeIngredients));
});
