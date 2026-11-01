// 실행: npm test
// 실제 데이터(data/app/, 또는 APP_DATA_DIR)로 도는 테스트는 데이터가 없으면 건너뛴다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

import { appDataPath } from '@/shared/db';

import type { Ingredient, Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

import { filterCandidates } from './filter-candidates.server';
import { MAX_PURCHASES } from './inventory';
import { PERISH_WEIGHT, recommend } from './recommend';

// 앱과 같은 경로에서 실제 데이터를 찾는다. 없으면 데이터로 도는 테스트는 건너뛴다
const hasData = existsSync(appDataPath('recipes.json'));
const load = <T>(name: string, empty: T): T => (hasData ? JSON.parse(readFileSync(appDataPath(name), 'utf-8')) : empty);
const recipes = load<Recipe[]>('recipes.json', []);
const ingredients = load<Ingredient[]>('ingredients.json', []);
const dataTest = test.skipIf(!hasData);

// 경쟁 앱을 써 볼 때 넣은 것과 같은 재료 묶음: 양파 1개, 대파 1단, 두부 1모, 애호박 1개, 계란 10개
const basket: Stock[] = [
  { ingredientId: '양파', grams: 200 },
  { ingredientId: '대파', grams: 800 },
  { ingredientId: '두부', grams: 300 },
  { ingredientId: '애호박', grams: 300 },
  { ingredientId: '계란', grams: 500 }
];

const run = (inventory: Stock[], meals: number, servings = 2) =>
  recommend(
    inventory,
    { meals, servings },
    { candidates: filterCandidates(recipes, inventory, servings), ingredients }
  );

dataTest('쓴 양은 재고에서 쓴 양과 사는 양을 더한 것과 같다', () => {
  const result = run(basket, 3);
  const used = new Map<string, number>();
  for (const m of result.meals)
    for (const u of m.uses) used.set(u.ingredientId, (used.get(u.ingredientId) ?? 0) + u.grams);
  const buy = new Map(result.shoppingList.map((s) => [s.ingredientId, s.grams]));
  const left = new Map(result.leftovers.map((l) => [l.ingredientId, l]));
  for (const [id, g] of used) {
    const fromStock = left.has(id) ? left.get(id)!.startGrams - left.get(id)!.leftGrams : 0;
    assert.ok(Math.abs(fromStock + (buy.get(id) ?? 0) - g) < 1, id);
  }
});

dataTest('고명이 아닌 사는 재료는 MAX_PURCHASES가지 이하다', () => {
  for (const meals of [3, 5])
    assert.ok(run(basket, meals).shoppingList.filter((s) => !s.optional).length <= MAX_PURCHASES);
});

dataTest('고명은 optional로 표시된다', () => {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  for (const meals of [3, 5]) {
    const r = run(basket, meals);
    for (const s of r.shoppingList) {
      const lines = r.meals
        .flatMap((m) => byId.get(m.recipeId)!.ingredients)
        .filter((i) => i.ingredientId === s.ingredientId);
      assert.equal(
        s.optional,
        lines.every((i) => i.vague),
        s.ingredientId
      );
    }
  }
});

const weightOf = (id: string) => PERISH_WEIGHT[ingredients.find((i) => i.id === id)?.perishability ?? ''] ?? 1;

dataTest('구매 한도 안에서 남는 양 점수가 가장 낮은 조합을 고른다', () => {
  const servings = 2;
  const candidates = filterCandidates(recipes, basket, servings);
  const stock = new Map(basket.map((s) => [s.ingredientId, s.grams]));
  let minLeft = Infinity;
  for (let a = 0; a < candidates.length; a++)
    for (let b = a + 1; b < candidates.length; b++)
      for (let c = b + 1; c < candidates.length; c++) {
        const used = new Map<string, number>();
        const firm = new Set<string>();
        for (const r of [candidates[a], candidates[b], candidates[c]])
          for (const i of r.ingredients) {
            if (i.grams === null) continue;
            used.set(i.ingredientId, (used.get(i.ingredientId) ?? 0) + i.grams * servings);
            if (!i.vague) firm.add(i.ingredientId);
          }
        if ([...used].some(([id, g]) => stock.has(id) && g > stock.get(id)! + 1e-9)) continue;
        const buys = [...used].filter(([id]) => firm.has(id) && !stock.has(id)).length;
        if (buys > MAX_PURCHASES) continue;
        const left = [...stock].reduce(
          (s, [id, g]) => s + (weightOf(id) * Math.max(0, g - (used.get(id) ?? 0))) / g,
          0
        );
        minLeft = Math.min(minLeft, left);
      }
  const result = recommend(basket, { meals: 3, servings }, { candidates, ingredients });
  const left = result.leftovers.reduce((s, l) => s + (weightOf(l.ingredientId) * l.leftGrams) / l.startGrams, 0);
  assert.ok(Math.abs(left - minLeft) < 0.01, `${left} vs ${minLeft}`);
});

// 사용자가 앱에서 써 본 묶음: 고기 두 가지만 있음
const meat: Stock[] = [
  { ingredientId: '돼지고기', grams: 200 },
  { ingredientId: '쇠고기', grams: 200 }
];

dataTest('가진 재료는 가진 양까지만 쓰고, 장보기에 넣지 않는다', () => {
  for (const [inv, servings] of [
    [basket, 2],
    [meat, 1]
  ] as const) {
    for (const meals of [1, 3, 5]) {
      const r = run([...inv], meals, servings);
      const have = new Set(inv.map((s) => s.ingredientId));
      for (const s of r.shoppingList) assert.ok(!have.has(s.ingredientId), `${s.ingredientId}를 더 사라고 함`);
      const used = new Map<string, number>();
      for (const m of r.meals)
        for (const u of m.uses) used.set(u.ingredientId, (used.get(u.ingredientId) ?? 0) + u.grams);
      for (const s of inv) assert.ok((used.get(s.ingredientId) ?? 0) <= s.grams + 0.5, s.ingredientId);
    }
  }
});

dataTest('maxPurchases 0이면 고명 말고는 사지 않는다', () => {
  for (const [inv, servings] of [
    [basket, 2],
    [meat, 1]
  ] as const) {
    const candidates = filterCandidates(recipes, [...inv], servings);
    for (const meals of [1, 3, 5]) {
      const r = recommend([...inv], { meals, servings, maxPurchases: 0 }, { candidates, ingredients });
      assert.equal(r.shoppingList.filter((s) => !s.optional).length, 0);
    }
  }
});

dataTest('고기 두 가지만 있어도 사지 않고 만들 수 있는 요리를 찾는다', () => {
  const candidates = filterCandidates(recipes, meat, 1);
  const r = recommend(meat, { meals: 1, servings: 1, maxPurchases: 0 }, { candidates, ingredients });
  assert.equal(r.meals.length, 1);
  assert.equal(r.meals[0].name, '돼지불고기');
});

dataTest('빨리 상하는 재료를 먼저 쓴다', () => {
  // 기준 묶음에서 애호박(빨리 상함)을 다 쓰는 조합이 나와야 한다
  const r = run(basket, 3);
  const zucchini = r.leftovers.find((l) => l.ingredientId === '애호박')!;
  assert.equal(zucchini.leftGrams, 0);
});

dataTest('인분 수만큼 사용량이 늘어난다', () => {
  // 가진 양을 넘기지 않도록 재고를 넉넉히 잡는다. 데이터가 바뀌어도 2인분이 재고 안에 들어가게 하려는 것이다.
  const plenty = basket.map((s) => ({ ...s, grams: s.grams * 10 }));
  const one = run(plenty, 1, 1).meals[0];
  const r = recipes.find((x) => x.id === one.recipeId)!;
  const two = recommend(plenty, { meals: 1, servings: 2 }, { candidates: [r], ingredients }).meals[0];
  for (const u of one.uses)
    assert.ok(Math.abs(two.uses.find((x) => x.ingredientId === u.ingredientId)!.grams - u.grams * 2) < 0.2);
});

dataTest('같은 레시피를 두 번 고르지 않는다', () => {
  const ids = run(basket, 5).meals.map((m) => m.recipeId);
  assert.equal(new Set(ids).size, ids.length);
});

dataTest('재료가 없으면 empty', () => {
  const result = run([], 3);
  assert.equal(result.status, 'empty');
  assert.equal(result.meals.length, 0);
});

dataTest('특수 양념은 pantryNeeded에만 들어간다', () => {
  const pantry = new Map(ingredients.map((i) => [i.id, i.pantry]));
  for (const m of run(basket, 3).meals) for (const id of m.pantryNeeded) assert.equal(pantry.get(id), '특수');
});

const rank = (g: string | null) => ({ '빨리 상함': 3, 보통: 2, '오래 감': 1 })[g ?? ''] ?? 0;

dataTest('day는 1부터 요리 수까지 겹치지 않게 붙고, 더 빨리 상하는 재료를 쓰는 요리가 먼저다', () => {
  for (const meals of [3, 5]) {
    const r = run(basket, meals);
    assert.deepEqual(
      [...r.meals.map((m) => m.day)].sort((a, b) => a - b),
      r.meals.map((_, i) => i + 1)
    );
    const byDay = [...r.meals].sort((a, b) => a.day - b.day);
    for (let i = 1; i < byDay.length; i++) assert.ok(rank(byDay[i - 1].urgency) >= rank(byDay[i].urgency));
  }
});

dataTest('urgency는 가진 재료 중 가장 빨리 상하는 등급이고 urgentIngredients가 그 재료다', () => {
  const grade = new Map(ingredients.map((i) => [i.id, i.perishability ?? null]));
  const owned = new Set(basket.map((s) => s.ingredientId));
  for (const m of run(basket, 5).meals) {
    const own = m.uses.filter((u) => owned.has(u.ingredientId));
    assert.equal(
      m.urgency,
      own.map((u) => grade.get(u.ingredientId) ?? null).sort((a, b) => rank(b) - rank(a))[0] ?? null
    );
    for (const id of m.urgentIngredients) assert.equal(grade.get(id), m.urgency);
    assert.ok(!('urgentGrams' in m));
  }
});

test('가진 재료의 등급으로 순서를 정하고, 등급이 같으면 그 재료를 많이 쓰는 요리가 먼저다', () => {
  const ing = (id: string, perishability: Ingredient['perishability']): Ingredient => ({
    id,
    aliases: [],
    pantry: null,
    unitGrams: { g: 1 },
    inputUnits: ['g'],
    gramsSource: null,
    perishability
  });
  const rec = (id: number, ingredientId: string, grams: number): Recipe => ({
    id,
    name: `요리${id}`,
    type: '국',
    cookingTime: '10분',
    level: '쉬움',
    servingsOriginal: 1,
    ingredients: [{ ingredientId, grams, vague: false, amountText: '', role: '주재료' }]
  });
  const data = {
    ingredients: [ing('감자', '오래 감'), ing('두부', '보통'), ing('상추', '빨리 상함'), ing('숙주', '빨리 상함')],
    candidates: [rec(1, '감자', 100), rec(2, '두부', 100), rec(3, '상추', 50), rec(4, '숙주', 100)]
  };
  const stock = ['감자', '두부', '상추', '숙주'].map((ingredientId) => ({ ingredientId, grams: 1000 }));
  const r = recommend(stock, { meals: 4, servings: 1 }, data);
  const day = (id: number) => r.meals.find((m) => m.recipeId === id)!.day;
  assert.deepEqual([day(4), day(3), day(2), day(1)], [1, 2, 3, 4]);
});

dataTest('기준 묶음 결과 출력', () => {
  for (const meals of [3, 5]) {
    const r = run(basket, meals);
    console.log(`\n[${meals}가지 요리, 2인분] status=${r.status}, 남는 비율=${r.leftoverRatio}`);
    for (const m of [...r.meals].sort((a, b) => a.day - b.day))
      console.log(
        `  ${m.day}번째 ${m.name}(${m.urgency ?? '-'}: ${m.urgentIngredients.join(', ')}): ${m.uses.map((u) => `${u.ingredientId} ${u.grams}g`).join(', ')}${m.toBuy.length ? ` (살 것: ${m.toBuy.join(', ')})` : ''}`
      );
    console.log(
      `  장보기: ${r.shoppingList.map((s) => `${s.ingredientId} ${s.grams}g${s.optional ? '(있으면 좋음)' : ''}`).join(', ') || '없음'}`
    );
    console.log(`  남는 양: ${r.leftovers.map((l) => `${l.ingredientId} ${l.leftGrams}/${l.startGrams}g`).join(', ')}`);
  }
});

test('남는 비율과 점수는 반올림하기 전 g으로 구한다', () => {
  // 재료마다 0.04g씩 남으면 leftGrams는 0으로 반올림되지만 남은 것은 있다
  const ing = (id: string): Ingredient => ({
    id,
    aliases: [],
    pantry: null,
    unitGrams: { g: 1 },
    inputUnits: ['g'],
    gramsSource: null,
    perishability: '보통'
  });
  const ids = ['가', '나', '다'];
  const rec: Recipe = {
    id: 1,
    name: '요리',
    type: '국',
    cookingTime: '10분',
    level: '쉬움',
    servingsOriginal: 1,
    ingredients: ids.map((ingredientId) => ({
      ingredientId,
      grams: 0.96,
      vague: false,
      amountText: '',
      role: '주재료'
    }))
  };
  const stock = ids.map((ingredientId) => ({ ingredientId, grams: 1 }));
  const r = recommend(stock, { meals: 1, servings: 1 }, { candidates: [rec], ingredients: ids.map(ing) });
  for (const l of r.leftovers) assert.equal(l.leftGrams, 0);
  assert.ok(r.leftoverRatio > 0, `${r.leftoverRatio}`);
  assert.ok(r.leftoverScore > 0);
});
