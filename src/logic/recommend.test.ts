// 실행: npm test
// 실제 데이터는 공개 저장소에 없다. 비공개 저장소 camp-project-1-data의 app/*.json을 data/app/에 복사해 두거나,
// APP_DATA_DIR로 그 폴더를 넘긴다.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { MAX_PURCHASES, PERISH_WEIGHT, filterCandidates, recommend } from "./recommend.ts";
import type { Ingredient, Recipe, Stock } from "./types.ts";

const dataDir = process.env.APP_DATA_DIR ?? path.join(process.cwd(), "data", "app");
const load = <T>(name: string): T => JSON.parse(readFileSync(path.join(dataDir, name), "utf-8"));
const recipes = load<Recipe[]>("recipes.json");
const ingredients = load<Ingredient[]>("ingredients.json");

// 경쟁 앱을 써 볼 때 넣은 것과 같은 재료 묶음: 양파 1개, 대파 1단, 두부 1모, 애호박 1개, 계란 10개
const basket: Stock[] = [
  { ingredientId: "양파", grams: 200 },
  { ingredientId: "대파", grams: 800 },
  { ingredientId: "두부", grams: 300 },
  { ingredientId: "애호박", grams: 300 },
  { ingredientId: "계란", grams: 500 },
];

const run = (inventory: Stock[], meals: number, servings = 2) =>
  recommend(inventory, { meals, servings }, { candidates: filterCandidates(recipes, inventory, servings), ingredients });

test("쓴 양은 재고에서 쓴 양과 사는 양을 더한 것과 같다", () => {
  const result = run(basket, 3);
  const used = new Map<string, number>();
  for (const m of result.meals) for (const u of m.uses) used.set(u.ingredientId, (used.get(u.ingredientId) ?? 0) + u.grams);
  const buy = new Map(result.shoppingList.map((s) => [s.ingredientId, s.grams]));
  const left = new Map(result.leftovers.map((l) => [l.ingredientId, l]));
  for (const [id, g] of used) {
    const fromStock = left.has(id) ? left.get(id)!.startGrams - left.get(id)!.leftGrams : 0;
    assert.ok(Math.abs(fromStock + (buy.get(id) ?? 0) - g) < 1, id);
  }
});

test("고명이 아닌 사는 재료는 MAX_PURCHASES가지 이하다", () => {
  for (const meals of [3, 5]) assert.ok(run(basket, meals).shoppingList.filter((s) => !s.optional).length <= MAX_PURCHASES);
});

test("고명은 optional로 표시된다", () => {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  for (const meals of [3, 5]) {
    const r = run(basket, meals);
    for (const s of r.shoppingList) {
      const lines = r.meals.flatMap((m) => byId.get(m.recipeId)!.ingredients).filter((i) => i.ingredientId === s.ingredientId);
      assert.equal(s.optional, lines.every((i) => i.vague), s.ingredientId);
    }
  }
});

const weightOf = (id: string) => PERISH_WEIGHT[ingredients.find((i) => i.id === id)?.perishability ?? ""] ?? 1;

test("구매 한도 안에서 남는 양 점수가 가장 낮은 조합을 고른다", () => {
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
        const left = [...stock].reduce((s, [id, g]) => s + (weightOf(id) * Math.max(0, g - (used.get(id) ?? 0))) / g, 0);
        minLeft = Math.min(minLeft, left);
      }
  const result = recommend(basket, { meals: 3, servings }, { candidates, ingredients });
  const left = result.leftovers.reduce((s, l) => s + (weightOf(l.ingredientId) * l.leftGrams) / l.startGrams, 0);
  assert.ok(Math.abs(left - minLeft) < 0.01, `${left} vs ${minLeft}`);
});

// 사용자가 앱에서 써 본 묶음: 고기 두 가지만 있음
const meat: Stock[] = [
  { ingredientId: "돼지고기", grams: 200 },
  { ingredientId: "쇠고기", grams: 200 },
];

test("가진 재료는 가진 양까지만 쓰고, 장보기에 넣지 않는다", () => {
  for (const [inv, servings] of [[basket, 2], [meat, 1]] as const) {
    for (const meals of [1, 3, 5]) {
      const r = run([...inv], meals, servings);
      const have = new Set(inv.map((s) => s.ingredientId));
      for (const s of r.shoppingList) assert.ok(!have.has(s.ingredientId), `${s.ingredientId}를 더 사라고 함`);
      const used = new Map<string, number>();
      for (const m of r.meals) for (const u of m.uses) used.set(u.ingredientId, (used.get(u.ingredientId) ?? 0) + u.grams);
      for (const s of inv) assert.ok((used.get(s.ingredientId) ?? 0) <= s.grams + 0.5, s.ingredientId);
    }
  }
});

test("maxPurchases 0이면 고명 말고는 사지 않는다", () => {
  for (const [inv, servings] of [[basket, 2], [meat, 1]] as const) {
    const candidates = filterCandidates(recipes, [...inv], servings);
    for (const meals of [1, 3, 5]) {
      const r = recommend([...inv], { meals, servings, maxPurchases: 0 }, { candidates, ingredients });
      assert.equal(r.shoppingList.filter((s) => !s.optional).length, 0);
    }
  }
});

test("고기 두 가지만 있어도 사지 않고 만들 수 있는 요리를 찾는다", () => {
  const candidates = filterCandidates(recipes, meat, 1);
  const r = recommend(meat, { meals: 1, servings: 1, maxPurchases: 0 }, { candidates, ingredients });
  assert.equal(r.meals.length, 1);
  assert.equal(r.meals[0].name, "돼지불고기");
});

test("빨리 상하는 재료를 먼저 쓴다", () => {
  // 기준 묶음에서 애호박(빨리 상함)을 다 쓰는 조합이 나와야 한다
  const r = run(basket, 3);
  const zucchini = r.leftovers.find((l) => l.ingredientId === "애호박")!;
  assert.equal(zucchini.leftGrams, 0);
});

test("인분 수만큼 사용량이 늘어난다", () => {
  // 가진 양을 넘기지 않도록 재고를 넉넉히 잡는다. 데이터가 바뀌어도 2인분이 재고 안에 들어가게 하려는 것이다.
  const plenty = basket.map((s) => ({ ...s, grams: s.grams * 10 }));
  const one = run(plenty, 1, 1).meals[0];
  const r = recipes.find((x) => x.id === one.recipeId)!;
  const two = recommend(plenty, { meals: 1, servings: 2 }, { candidates: [r], ingredients }).meals[0];
  for (const u of one.uses) assert.ok(Math.abs(two.uses.find((x) => x.ingredientId === u.ingredientId)!.grams - u.grams * 2) < 0.2);
});

test("같은 레시피를 두 번 고르지 않는다", () => {
  const ids = run(basket, 5).meals.map((m) => m.recipeId);
  assert.equal(new Set(ids).size, ids.length);
});

test("재료가 없으면 empty", () => {
  const result = run([], 3);
  assert.equal(result.status, "empty");
  assert.equal(result.meals.length, 0);
});

test("특수 양념은 pantryNeeded에만 들어간다", () => {
  const pantry = new Map(ingredients.map((i) => [i.id, i.pantry]));
  for (const m of run(basket, 3).meals) for (const id of m.pantryNeeded) assert.equal(pantry.get(id), "특수");
});

test("기준 묶음 결과 출력", () => {
  for (const meals of [3, 5]) {
    const r = run(basket, meals);
    console.log(`\n[${meals}가지 요리, 2인분] status=${r.status}, 남는 비율=${r.leftoverRatio}`);
    for (const m of r.meals) console.log(`  ${m.name}: ${m.uses.map((u) => `${u.ingredientId} ${u.grams}g`).join(", ")}${m.toBuy.length ? ` (살 것: ${m.toBuy.join(", ")})` : ""}`);
    console.log(`  장보기: ${r.shoppingList.map((s) => `${s.ingredientId} ${s.grams}g${s.optional ? "(있으면 좋음)" : ""}`).join(", ") || "없음"}`);
    console.log(`  남는 양: ${r.leftovers.map((l) => `${l.ingredientId} ${l.leftGrams}/${l.startGrams}g`).join(", ")}`);
  }
});
