// @vitest-environment jsdom
// 요리 카드가 day 순서, 순서 이유, 사야 하는 양을 요구사항대로 보여 주는지 확인한다.

import assert from 'node:assert/strict';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, test } from 'vitest';

import type { Meal, Result } from '@/features/find-meals';
import type { Ingredient, InputUnit } from '@/entities/ingredient';
import { copy } from '@/shared/copy';

import { MealList } from './meal-list';

afterEach(cleanup);

const make = (id: string, unitGrams: Partial<Record<InputUnit, number>>): Ingredient => ({
  id,
  aliases: [],
  pantry: null,
  unitGrams: { ...unitGrams, g: 1 },
  inputUnits: [...(Object.keys(unitGrams) as InputUnit[]), 'g'],
  gramsSource: 'AI 추정'
});
const ingredients = new Map(
  [
    make('두부', { 모: 300 }),
    make('상추', { 장: 10 }),
    make('청고추', { 개: 10 }),
    make('표고버섯', { 개: 20 }),
    make('대파', { 대: 100 })
  ].map((i) => [i.id, i])
);

const meal = (day: number, overrides: Partial<Meal> = {}): Meal => ({
  recipeId: day,
  name: `요리${day}`,
  uses: [{ ingredientId: '두부', grams: 150 }],
  toBuy: [],
  pantryNeeded: [],
  day,
  urgency: '보통',
  urgentIngredients: ['두부'],
  ...overrides
});

const result: Result = {
  status: 'ok',
  // meals 배열 순서와 day가 다르다
  meals: [
    meal(2),
    meal(1, {
      uses: [
        { ingredientId: '상추', grams: 30 },
        { ingredientId: '청고추', grams: 20 },
        { ingredientId: '표고버섯', grams: 40 },
        { ingredientId: '대파', grams: 5 }
      ],
      toBuy: ['청고추', '표고버섯', '대파'],
      pantryNeeded: ['마늘'],
      urgency: '빨리 상함',
      urgentIngredients: ['상추']
    })
  ],
  shoppingList: [
    { ingredientId: '청고추', grams: 20, optional: false },
    { ingredientId: '표고버섯', grams: 40, optional: false },
    { ingredientId: '대파', grams: 5, optional: true }
  ],
  leftovers: [],
  leftoverRatio: 0,
  leftoverScore: 0
};

const renderList = () =>
  render(
    <MealList
      result={result}
      recipes={new Map()}
      ingredients={ingredients}
      units={{ 두부: '모', 상추: '장' }}
      onOpenMeal={() => {}}
    />
  );

test('day 순서로 보여 주고, 카드마다 같은 뜻의 opener를 단다', () => {
  renderList();
  const cards = screen.getAllByRole('button');
  assert.deepEqual(
    cards.map((card) => card.getAttribute('data-sheet-opener')),
    ['recipe-1', 'recipe-2']
  );
  assert.ok(cards[0].textContent?.startsWith(copy.mealCard.order(1)));
});

test('순서 이유는 빨리 상함일 때만 쓴다', () => {
  renderList();
  // 순서 이유는 순서 라벨 태그 옆에 이어 쓴다
  const [first, second] = screen.getAllByRole('button');
  assert.ok(first.textContent?.includes(`${copy.mealCard.order(1)} ${copy.mealCard.orderReason('상추')}`));
  assert.ok(!second.textContent?.includes(copy.mealCard.orderReason('두부')));
});

test('사야 하는 재료는 기본 단위와 g으로, 있으면 좋은 재료는 양 없이 쓴다', () => {
  renderList();
  screen.getByText(copy.mealCard.toBuy('청고추 2개 (20g), 표고버섯 2개 (40g)'));
  // 이름만 굵게 그려 요소가 나뉘므로 글자 내용으로 찾는다
  const [first] = screen.getAllByRole('button');
  assert.ok(first.textContent?.includes(`${copy.mealCard.optionalLabel}: 대파`));
  assert.ok(first.textContent?.includes(`${copy.mealCard.specialSeasoningLabel}: 마늘`));
  // 가진 재료는 사용자가 고른 단위로 쓰고, 사는 재료는 넣지 않는다
  screen.getByText('상추 3장');
  screen.getByText('두부 ½모');
});
