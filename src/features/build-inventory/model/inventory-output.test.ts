// 재료 고르기(검색, 격자 순서)와 결과 화면에 넘기는 입력(toStocks, isInventoryReady)을 확인한다.
// 격자 순서의 마지막 묶음만 실제 데이터를 쓰고, 데이터가 없으면 건너뛴다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

import type { Ingredient } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';
import { appDataPath } from '@/shared/db';

import { orderPickable } from './pickable';
import { findSeasonings, matchesQuery } from './search';
import { isInventoryReady, toStocks } from './to-stocks';

const make = (id: string, extra: Partial<Ingredient> = {}): Ingredient => ({
  id,
  aliases: [],
  pantry: null,
  unitGrams: { 개: 200, g: 1 },
  inputUnits: ['개', 'g'],
  gramsSource: 'AI 추정',
  ...extra
});
const recipe = (...ids: string[]): Recipe => ({
  id: 1,
  name: '',
  type: '',
  cookingTime: '',
  level: '',
  servingsOriginal: 1,
  ingredients: ids.map((ingredientId) => ({ ingredientId, grams: 1, vague: false, amountText: '', role: '주재료' }))
});

test('검색은 이름과 다른 이름에서 공백을 빼고 찾는다', () => {
  const paprika = make('노랑 파프리카');
  const beef = make('쇠고기', { aliases: ['소고기'] });
  assert.equal(matchesQuery(paprika, '노랑파프리카'), true);
  assert.equal(matchesQuery(paprika, ' 파프 '), true);
  assert.equal(matchesQuery(beef, '소고기'), true);
  assert.equal(matchesQuery(beef, '돼지'), false);
  assert.equal(matchesQuery(beef, '   '), true);
});

test('격자는 레시피에 많이 나오는 순서, 같으면 가나다순이고 양념은 빠진다', () => {
  const { pickable, pantryBasics } = orderPickable(
    [make('양파'), make('감자'), make('당근'), make('소금', { pantry: '기본' }), make('굴소스', { pantry: '특수' })],
    [recipe('양파', '당근', '소금'), recipe('양파')]
  );
  assert.deepEqual(
    pickable.map((i) => i.id),
    ['양파', '당근', '감자']
  );
  assert.deepEqual(pantryBasics, ['소금']);
});

test('양념은 pantry가 null이 아닌 재료이고 데이터 순서를 지킨다', () => {
  const { seasonings } = orderPickable(
    [make('양파'), make('소금', { pantry: '기본' }), make('굴소스', { pantry: '특수' })],
    []
  );
  assert.deepEqual(
    seasonings.map((i) => i.id),
    ['소금', '굴소스']
  );
});

test('양념 검색은 종류별로 id를 돌려주고 별칭의 대괄호 앞부분은 찾지 않는다', () => {
  const { seasonings } = orderPickable(
    [
      make('간장', { pantry: '기본', aliases: ['[불고기양념] 간장', '조림간장'] }),
      make('마늘', { pantry: '특수', aliases: ['다진 마늘', '다진마늘'] }),
      make('다진고추', { pantry: '특수', aliases: ['다진마늘고추'] })
    ],
    []
  );
  assert.deepEqual(findSeasonings(seasonings, '간장'), { basic: ['간장'], special: [] });
  assert.deepEqual(findSeasonings(seasonings, '다진마늘'), { basic: [], special: ['마늘', '다진고추'] });
  assert.deepEqual(findSeasonings(seasonings, '불고기'), { basic: [], special: [] });
  assert.deepEqual(findSeasonings(seasonings, '불고기양념 간장'), { basic: [], special: [] });
  assert.deepEqual(findSeasonings(seasonings, '   '), { basic: [], special: [] });
});

test('결과 화면에 넘기는 g은 고른 단위로 환산하고 담은 순서를 지킨다', () => {
  const ingredients = [make('양파'), make('두부', { unitGrams: { 모: 300, g: 1 }, inputUnits: ['모', 'g'] })];
  const items = [
    { ingredientId: '두부', amount: 0.5, unit: '모' as const },
    { ingredientId: '양파', amount: 150, unit: 'g' as const },
    { ingredientId: '없는재료', amount: 1, unit: '개' as const },
    { ingredientId: '양파', amount: null, unit: '개' as const }
  ];
  assert.deepEqual(toStocks(items, ingredients), [
    { ingredientId: '두부', grams: 150 },
    { ingredientId: '양파', grams: 150 }
  ]);
  // 환산 근거가 없는 단위는 0g이라 뺀다
  assert.deepEqual(toStocks([{ ingredientId: '양파', amount: 1, unit: '모' }], ingredients), []);
});

test('재료가 있고 모두 양을 정해야 결과로 넘어갈 수 있다', () => {
  assert.equal(isInventoryReady({ items: [] }), false);
  assert.equal(isInventoryReady({ items: [{ ingredientId: '양파', amount: null, unit: '개' }] }), false);
  assert.equal(isInventoryReady({ items: [{ ingredientId: '양파', amount: 1, unit: '개' }] }), true);
});

const ingredientsFile = appDataPath('ingredients.json');
const recipesFile = appDataPath('recipes.json');
const hasData = existsSync(ingredientsFile) && existsSync(recipesFile);

test.skipIf(!hasData)('실제 데이터: 고르는 재료에 양념이 없고 레시피 횟수 순서다', () => {
  const ingredients: Ingredient[] = JSON.parse(readFileSync(ingredientsFile, 'utf-8'));
  const recipes: Recipe[] = JSON.parse(readFileSync(recipesFile, 'utf-8'));
  const { pickable, pantryBasics } = orderPickable(ingredients, recipes);
  assert.equal(
    pickable.every((i) => i.pantry === null),
    true
  );
  assert.equal(pickable.length, ingredients.filter((i) => i.pantry === null).length);
  assert.ok(pantryBasics.length > 0);
  const count = (id: string) => recipes.filter((r) => r.ingredients.some((x) => x.ingredientId === id)).length;
  for (let i = 1; i < pickable.length; i++) {
    assert.ok(count(pickable[i - 1].id) >= count(pickable[i].id), `${pickable[i - 1].id} → ${pickable[i].id}`);
  }
});
