import assert from 'node:assert/strict';
import { test } from 'vitest';

import { mealPurchases } from './purchases';
import type { Meal } from './types';

const meal: Meal = {
  recipeId: 1,
  name: '두부조림',
  uses: [
    { ingredientId: '두부', grams: 300 },
    { ingredientId: '청고추', grams: 20 },
    { ingredientId: '홍고추', grams: 2 },
    { ingredientId: '표고버섯', grams: 40 }
  ],
  toBuy: ['청고추', '홍고추', '표고버섯'],
  pantryNeeded: [],
  day: 1,
  urgency: null,
  urgentIngredients: []
};

test('사야 하는 재료와 있으면 좋은 재료를 toBuy 순서대로 나눈다', () => {
  const purchases = mealPurchases(meal, [
    { ingredientId: '표고버섯', grams: 80, optional: false },
    { ingredientId: '홍고추', grams: 1, optional: true },
    { ingredientId: '청고추', grams: 20, optional: false }
  ]);
  assert.deepEqual(purchases, {
    required: [
      { ingredientId: '청고추', grams: 20 },
      { ingredientId: '표고버섯', grams: 40 }
    ],
    optional: ['홍고추']
  });
});

test('사는 재료가 없으면 둘 다 비어 있다', () => {
  assert.deepEqual(mealPurchases({ ...meal, toBuy: [] }, []), { required: [], optional: [] });
});
