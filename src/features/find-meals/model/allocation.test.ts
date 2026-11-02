// 실제 데이터(data/app/, 또는 APP_DATA_DIR)로 도는 테스트는 데이터가 없으면 건너뛴다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

import { appDataPath } from '@/shared/db';

import type { Ingredient, Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

import { allocateStock } from './allocation';
import { findMealOptions } from './compare';
import { filterCandidates } from './filter-candidates.server';
import { splitLeftovers } from './leftovers';
import type { Meal, Result } from './types';

const meal = (day: number, uses: Meal['uses'], toBuy: string[] = []): Meal => ({
  recipeId: day * 10,
  name: `요리${day}`,
  uses,
  toBuy,
  pantryNeeded: [],
  day,
  urgency: null,
  urgentIngredients: []
});

const result = (meals: Meal[], leftovers: Result['leftovers'], shoppingList: Result['shoppingList'] = []): Result => ({
  status: 'ok',
  meals,
  shoppingList,
  leftovers,
  leftoverRatio: 0,
  leftoverScore: 0
});

test('splitLeftovers: 1g 미만은 다 쓴 재료, 남는 재료는 남는 비율 순서', () => {
  const { usedUp, remaining } = splitLeftovers([
    { ingredientId: '두부', startGrams: 300, leftGrams: 0.9 },
    { ingredientId: '배추', startGrams: 2000, leftGrams: 200 },
    { ingredientId: '대파', startGrams: 100, leftGrams: 50 },
    { ingredientId: '계란', startGrams: 300, leftGrams: 1 }
  ]);
  assert.deepEqual(
    usedUp.map((l) => l.ingredientId),
    ['두부']
  );
  assert.deepEqual(
    remaining.map((l) => l.ingredientId),
    ['대파', '배추', '계란']
  );
});

test('allocateStock: 요리별 사용분을 day 순서로 두고, 다 쓴 재료는 뒤에 둔다', () => {
  const allocations = allocateStock(
    result(
      // meals 배열 순서와 day가 다르다
      [
        meal(2, [{ ingredientId: '두부', grams: 100 }]),
        meal(1, [
          { ingredientId: '두부', grams: 150 },
          { ingredientId: '계란', grams: 100 }
        ])
      ],
      [
        { ingredientId: '계란', startGrams: 100, leftGrams: 0 },
        { ingredientId: '두부', startGrams: 300, leftGrams: 50 }
      ]
    )
  );
  assert.deepEqual(
    allocations.map((a) => [a.ingredientId, a.parts.map((p) => [p.day, p.grams])]),
    [
      [
        '두부',
        [
          [1, 150],
          [2, 100]
        ]
      ],
      ['계란', [[1, 100]]]
    ]
  );
});

test('allocateStock: 고명을 산 만큼은 빼고 가진 양만 나눈다', () => {
  // 대파 30g을 가졌고, 1번째 요리가 고명이 아닌 분량 20g, 2·3번째 요리가 고명으로 10g씩 쓴다. 10g을 산다
  const allocations = allocateStock(
    result(
      [
        meal(1, [{ ingredientId: '대파', grams: 20 }]),
        meal(2, [{ ingredientId: '대파', grams: 10 }], ['대파']),
        meal(3, [{ ingredientId: '대파', grams: 10 }], ['대파'])
      ],
      [{ ingredientId: '대파', startGrams: 30, leftGrams: 0 }],
      [{ ingredientId: '대파', grams: 10, optional: true }]
    )
  );
  assert.deepEqual(
    allocations[0].parts.map((p) => [p.day, p.grams]),
    [
      [1, 20],
      [2, 10]
    ]
  );
});

const hasData = existsSync(appDataPath('recipes.json'));
const load = <T>(name: string, empty: T): T => (hasData ? JSON.parse(readFileSync(appDataPath(name), 'utf-8')) : empty);
const recipes = load<Recipe[]>('recipes.json', []);
const ingredients = load<Ingredient[]>('ingredients.json', []);

const baskets: Stock[][] = [
  [
    { ingredientId: '양파', grams: 200 },
    { ingredientId: '대파', grams: 800 },
    { ingredientId: '두부', grams: 300 },
    { ingredientId: '애호박', grams: 300 },
    { ingredientId: '계란', grams: 500 }
  ],
  [
    { ingredientId: '두부', grams: 300 },
    { ingredientId: '계란', grams: 300 },
    { ingredientId: '대파', grams: 100 },
    { ingredientId: '애호박', grams: 300 }
  ],
  [{ ingredientId: '대파', grams: 30 }]
];

test.skipIf(!hasData)('allocateStock: 실제 데이터에서 사용분 합과 남는 양이 처음 양과 같다', () => {
  for (const inventory of baskets) {
    for (const servings of [1, 2, 4]) {
      const options = findMealOptions(inventory, servings, {
        candidates: filterCandidates(recipes, inventory, servings),
        ingredients
      });
      for (const comparison of [options.noBuy, options.buy]) {
        for (const { result: r } of comparison.options) {
          for (const a of allocateStock(r)) {
            const used = a.parts.reduce((sum, p) => sum + p.grams, 0);
            assert.ok(
              Math.abs(used + a.leftGrams - a.startGrams) <= 0.1 * (a.parts.length + 1),
              `${a.ingredientId} ${used} + ${a.leftGrams} ≠ ${a.startGrams}`
            );
            assert.deepEqual(
              a.parts.map((p) => p.day),
              [...a.parts.map((p) => p.day)].sort((x, y) => x - y)
            );
          }
        }
      }
    }
  }
});
