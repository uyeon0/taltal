// 레시피 재료를 무리로 나누는 규칙과, 시트와 서버 이미지가 함께 쓸 값을 확인한다.
// 실제 데이터(data/app/, 또는 APP_DATA_DIR)로 도는 테스트는 데이터가 없으면 건너뛴다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

import type { Meal, Result } from '@/features/find-meals';
import { formatAmount, type Ingredient, type InputUnit } from '@/entities/ingredient';
import type { Recipe, RecipeDetail } from '@/entities/recipe';
import { appDataPath } from '@/shared/db';

import { groupIngredients } from './group-ingredients';
import { toRecipeDetailView } from './recipe-detail-view';

const make = (id: string, unitGrams: Partial<Record<InputUnit, number>>): Ingredient => ({
  id,
  aliases: [],
  pantry: null,
  unitGrams: { ...unitGrams, g: 1 },
  inputUnits: [...(Object.keys(unitGrams) as InputUnit[]), 'g'],
  gramsSource: 'AI 추정'
});
const INGREDIENTS = [
  make('콩나물', { 봉지: 300 }),
  make('대파', { 대: 100 }),
  make('청고추', { 개: 10 }),
  make('쪽파', { 줄: 5 })
];

// 데이터처럼 role과 grams가 어긋나는 재료를 섞는다: 대파는 role이 양념인데 g이 있고, 녹말은 부재료인데 g이 없다
const recipe: Recipe = {
  id: 1,
  name: '콩나물밥',
  type: '밥',
  cookingTime: '40분',
  level: '보통',
  servingsOriginal: 4,
  ingredients: [
    { ingredientId: '쌀', grams: null, vague: false, amountText: '2컵', role: '주재료' },
    { ingredientId: '콩나물', grams: 75, vague: false, amountText: '300g', role: '주재료' },
    { ingredientId: '대파', grams: 12.5, vague: false, amountText: '1/2개', role: '양념' },
    { ingredientId: '청고추', grams: 5, vague: false, amountText: '2개', role: '부재료' },
    { ingredientId: '녹말', grams: null, vague: false, amountText: '약간', role: '부재료' },
    { ingredientId: '쪽파', grams: 2, vague: true, amountText: '약간', role: '부재료' }
  ]
};

// 2인분. 청고추는 없어서 사고, 쪽파는 조금 가졌지만 고명으로 쓰기에 모자라 있으면 좋은 재료다
const meal: Meal = {
  recipeId: 1,
  name: '콩나물밥',
  uses: [
    { ingredientId: '콩나물', grams: 150 },
    { ingredientId: '대파', grams: 25 },
    { ingredientId: '청고추', grams: 10 },
    { ingredientId: '쪽파', grams: 4 }
  ],
  toBuy: ['청고추', '쪽파'],
  pantryNeeded: [],
  day: 2,
  urgency: '보통',
  urgentIngredients: ['콩나물']
};
const shoppingList: Result['shoppingList'] = [
  { ingredientId: '청고추', grams: 10, optional: false },
  { ingredientId: '쪽파', grams: 1, optional: true }
];
const units: Record<string, InputUnit> = { 콩나물: '봉지', 대파: 'g', 쪽파: '줄' };

const detail: RecipeDetail = {
  id: 1,
  summary: '아삭한 콩나물밥',
  steps: [
    { no: 2, text: '밥을 짓는다.', tip: '물은 적게 잡는다.' },
    { no: 1, text: '콩나물을 씻는다.', tip: null }
  ]
};

test('groupIngredients: role이 아니라 grams로 나누고, 모든 재료가 원문 순서대로 한 무리에 한 번씩 들어간다', () => {
  const groups = groupIngredients(meal, recipe, shoppingList);
  assert.deepEqual(
    groups.owned.map((o) => [o.ingredient.ingredientId, o.grams]),
    [
      ['콩나물', 150],
      ['대파', 25]
    ]
  );
  assert.deepEqual(
    groups.toBuy.map((o) => [o.ingredient.ingredientId, o.grams]),
    [['청고추', 10]]
  );
  // 조금 가진 고명이 모자라면 가진 재료에 두지 않고 있으면 좋은 재료에만 둔다
  assert.deepEqual(
    groups.optional.map((o) => o.ingredientId),
    ['쪽파']
  );
  assert.deepEqual(
    groups.seasonings.map((o) => o.ingredientId),
    ['쌀', '녹말']
  );
});

test('toRecipeDetailView: 양은 요리 카드와 같은 formatAmount 호출로 쓴다', () => {
  const view = toRecipeDetailView(meal, shoppingList, recipe, detail, INGREDIENTS, units);
  const [bean, , pepper] = INGREDIENTS;
  assert.deepEqual(view.owned, [
    { name: '콩나물', amount: formatAmount(bean, 150, '봉지'), originalAmount: '300g' },
    { name: '대파', amount: '25g', originalAmount: '1/2개' }
  ]);
  assert.equal(view.owned[0].amount, '½봉지');
  assert.deepEqual(view.toBuy, [{ name: '청고추', amount: formatAmount(pepper, 10, '개', { withGrams: true }) }]);
  assert.equal(view.toBuy[0].amount, '1개 (10g)');
  assert.deepEqual(view.optional, ['쪽파']);
  assert.deepEqual(view.seasonings, [
    { name: '쌀', amount: '2컵' },
    { name: '녹말', amount: '약간' }
  ]);
  assert.equal(view.day, 2);
  assert.equal(view.servingsOriginal, 4);
});

test('toRecipeDetailView: 조리 과정은 no 순서이고, 상세가 없으면 요약과 만드는 법이 null이다', () => {
  const view = toRecipeDetailView(meal, shoppingList, recipe, detail, INGREDIENTS, units);
  assert.deepEqual(
    view.steps?.map((s) => s.no),
    [1, 2]
  );
  assert.equal(view.summary, '아삭한 콩나물밥');

  const pending = toRecipeDetailView(meal, shoppingList, recipe, null, INGREDIENTS, units);
  assert.equal(pending.summary, null);
  assert.equal(pending.steps, null);
  assert.equal(pending.owned.length, 2);
});

test('toRecipeDetailView: 결과를 JSON으로 보냈다 받아도 같다', () => {
  const view = toRecipeDetailView(meal, shoppingList, recipe, detail, INGREDIENTS, units);
  assert.deepEqual(JSON.parse(JSON.stringify(view)), view);
});

const hasData = existsSync(appDataPath('recipes.json'));
const load = <T>(name: string, empty: T): T => (hasData ? JSON.parse(readFileSync(appDataPath(name), 'utf-8')) : empty);

test.skipIf(!hasData)(
  '실제 데이터: 모든 레시피의 재료가 빠짐없이 한 무리에 들어가고, g이 없는 재료는 모두 양념이다',
  () => {
    const recipes = load<Recipe[]>('recipes.json', []);
    const ingredients = load<Ingredient[]>('ingredients.json', []);
    const pantry = new Map(ingredients.map((i) => [i.id, i.pantry]));
    for (const r of recipes) {
      const uses = r.ingredients.flatMap((i) =>
        i.grams === null ? [] : [{ ingredientId: i.ingredientId, grams: i.grams * 2 }]
      );
      const m: Meal = { ...meal, recipeId: r.id, name: r.name, uses, toBuy: [] };
      const view = toRecipeDetailView(m, [], r, null, ingredients, {});
      assert.equal(view.owned.length + view.seasonings.length, r.ingredients.length, r.name);
      for (const s of view.seasonings) assert.notEqual(pantry.get(s.name), null, `${r.name} ${s.name}`);
      for (const o of view.owned) assert.notEqual(o.amount, '', `${r.name} ${o.name}`);
    }
  }
);
