// 후보 고르기 규칙(docs/data-contract.md "후보 고르기") 중 실제 데이터 없이 확인할 수 있는 경우를 본다.

import assert from 'node:assert/strict';
import { test } from 'vitest';

import type { Recipe } from '@/entities/recipe';

import { filterCandidates } from './filter-candidates.server';

const recipe = (id: number, lines: [string, number, boolean][]): Recipe => ({
  id,
  name: `요리${id}`,
  type: '국',
  cookingTime: '10분',
  level: '쉬움',
  servingsOriginal: 1,
  ingredients: lines.map(([ingredientId, grams, vague]) => ({
    ingredientId,
    grams,
    vague,
    amountText: vague ? '약간' : `${grams}g`,
    role: '주재료'
  }))
});

test('가진 재료를 고명으로만 쓰는 레시피는 후보가 아니다', () => {
  const garnishOnly = recipe(1, [
    ['대파', 5, true],
    ['쇠고기', 100, false]
  ]);
  const mainUse = recipe(2, [
    ['대파', 50, false],
    ['쇠고기', 100, false]
  ]);
  const ids = filterCandidates([garnishOnly, mainUse], [{ ingredientId: '대파', grams: 800 }], 1).map((r) => r.id);
  assert.deepEqual(ids, [2]);
});

test('같은 재료가 여러 줄이면 합으로 재고와 비교한다', () => {
  // 대파 60g + 50g = 110g. 가진 대파 100g을 넘으므로 후보가 아니다
  const twice = recipe(3, [
    ['대파', 60, false],
    ['대파', 50, false]
  ]);
  assert.deepEqual(filterCandidates([twice], [{ ingredientId: '대파', grams: 100 }], 1), []);
  assert.equal(filterCandidates([twice], [{ ingredientId: '대파', grams: 110 }], 1).length, 1);
});
