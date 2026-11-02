// 3·4·5가지 비교 규칙(docs/data-contract.md "3·4·5가지 비교")과, 테스트용 가짜 데이터로 만든 네 가지 결과 상태를 확인한다.

import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import type { Stock } from '@/entities/ingredient';

import { fakeBaskets, fakeIngredients, fakeRecipes } from './__fixtures__/fake-data';
import { compare, findMealOptions, shouldSuggestBuy, type Comparison, type Option } from './compare';
import { filterCandidates } from './filter-candidates.server';
import type { Result } from './types';

// meals에는 개수만 필요하므로 빈 객체로 채운다. 비교는 leftoverScore로 한다
const result = (status: Result['status'], meals: number, leftoverScore: number): Result => ({
  status,
  meals: Array.from({ length: meals }, () => ({}) as Result['meals'][number]),
  shoppingList: [],
  leftovers: [],
  leftoverRatio: 0,
  leftoverScore
});

test('가짓수가 늘수록 남는 양 점수가 줄면 모두 남기고, 마지막 것을 처음 고른다', () => {
  const c = compare([result('ok', 3, 0.5), result('ok', 4, 0.4), result('ok', 5, 0.3)]);
  assert.deepEqual(
    c.options.map((o) => o.dishes),
    [3, 4, 5]
  );
  assert.equal(c.best, 2);
});

test('g 비율이 아니라 남는 양 점수로 비교한다', () => {
  // 4가지가 g 비율로는 더 남아도(무거운 재료가 남음) 점수가 낮으면(빨리 상하는 재료를 다 씀) 남긴다
  const three = { ...result('ok', 3, 1.2), leftoverRatio: 0.3 };
  const four = { ...result('ok', 4, 0.8), leftoverRatio: 0.4 };
  assert.deepEqual(
    compare([three, four]).options.map((o) => o.dishes),
    [3, 4]
  );
});

test('가짓수가 더 많은데 남는 양 점수가 줄지 않는 결과는 뺀다', () => {
  const c = compare([result('ok', 3, 0.5), result('ok', 4, 0.5), result('ok', 5, 0.6)]);
  assert.deepEqual(
    c.options.map((o) => o.dishes),
    [3]
  );
  assert.equal(c.best, 0);
});

test('partial은 찾은 가짓수로 남기고, 같은 가짓수가 이미 있으면 뺀다', () => {
  // 5가지를 요청해 4가지만 찾으면 4가지 결과와 같다
  const c = compare([result('ok', 3, 0.5), result('ok', 4, 0.4), result('partial', 4, 0.4)]);
  assert.deepEqual(
    c.options.map((o) => o.dishes),
    [3, 4]
  );
  // 3가지를 요청해 2가지만 찾으면 2가지 탭으로 남는다
  const d = compare([result('partial', 2, 0.5), result('partial', 2, 0.5)]);
  assert.deepEqual(
    d.options.map((o) => o.dishes),
    [2]
  );
});

test('empty는 빼고, 모두 empty면 결과가 없다', () => {
  const c = compare([result('empty', 0, 1), result('empty', 0, 1)]);
  assert.equal(c.options.length, 0);
  assert.equal(c.best, -1);
});

const run = (inventory: Stock[]) => {
  const candidates = filterCandidates(fakeRecipes, inventory, 1);
  return findMealOptions(inventory, 1, { candidates, ingredients: fakeIngredients });
};
const dishes = (c: { options: Option[] }) => c.options.map((o) => o.dishes);
const names = (c: { options: Option[] }) => c.options.map((o) => o.result.meals.map((m) => m.name).join('/'));

test('가짜 데이터: normal은 사지 않는 묶음으로 3·4·5가지가 모두 나온다', () => {
  const r = run(fakeBaskets.normal);
  assert.deepEqual(dishes(r.noBuy), [3, 4, 5]);
  for (const o of r.noBuy.options) assert.equal(o.result.status, 'ok');
});

test('가짜 데이터: withPurchase는 조금 사는 묶음이 사지 않는 묶음과 다르다', () => {
  const r = run(fakeBaskets.withPurchase);
  assert.ok(r.buy.options.length > 0);
  assert.notDeepEqual(names(r.buy), names(r.noBuy));
  assert.ok(r.buy.options.some((o) => o.result.shoppingList.some((s) => !s.optional)));
});

test('가짜 데이터: partial은 사지 않는 묶음으로 요청보다 적게 나온다', () => {
  const r = run(fakeBaskets.partial);
  assert.ok(r.noBuy.options.length > 0);
  for (const o of r.noBuy.options) assert.equal(o.result.status, 'partial');
});

test('가짜 데이터: empty는 두 묶음 모두 추천이 없다', () => {
  const r = run(fakeBaskets.empty);
  assert.equal(r.noBuy.options.length, 0);
  assert.equal(r.buy.options.length, 0);
});

describe('shouldSuggestBuy', () => {
  const comparison = (...results: Result[]): Comparison =>
    results.length === 0 ? { options: [], best: -1 } : compare(results);
  const withShopping = (r: Result, shoppingList: Result['shoppingList']): Result => ({ ...r, shoppingList });
  const buyTofu = [{ ingredientId: '두부', grams: 100, optional: false }];

  test('조금 사는 쪽이 비었거나 사지 않는 쪽이 비면 제안하지 않는다', () => {
    assert.equal(shouldSuggestBuy(comparison(result('ok', 3, 0.5)), comparison()), false);
    assert.equal(shouldSuggestBuy(comparison(), comparison(withShopping(result('ok', 3, 0.1), buyTofu))), false);
  });

  test('고명만 사면 제안하지 않는다', () => {
    const garnish = [{ ingredientId: '대파', grams: 5, optional: true }];
    assert.equal(
      shouldSuggestBuy(comparison(result('ok', 3, 0.5)), comparison(withShopping(result('ok', 3, 0.1), garnish))),
      false
    );
  });

  test('남는 양 점수가 같거나 더 크면 제안하지 않고, 작으면 제안한다', () => {
    const noBuy = comparison(result('ok', 3, 0.5));
    assert.equal(shouldSuggestBuy(noBuy, comparison(withShopping(result('ok', 3, 0.5), buyTofu))), false);
    assert.equal(shouldSuggestBuy(noBuy, comparison(withShopping(result('ok', 3, 0.6), buyTofu))), false);
    assert.equal(shouldSuggestBuy(noBuy, comparison(withShopping(result('ok', 3, 0.4), buyTofu))), true);
  });

  test('두 묶음 모두 가장 덜 남는 탭끼리 비교한다', () => {
    const noBuy = comparison(result('ok', 3, 0.5), result('ok', 4, 0.2));
    const buy = comparison(withShopping(result('ok', 3, 0.3), buyTofu), withShopping(result('ok', 4, 0.25), buyTofu));
    assert.equal(shouldSuggestBuy(noBuy, buy), false);
  });
});
