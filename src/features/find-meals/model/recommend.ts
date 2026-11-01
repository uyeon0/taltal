// 가진 재료로 요리 조합을 고른다. 코드의 meals는 화면의 "N가지 요리"다.
// filterCandidates는 서버에서, recommend는 브라우저에서 쓴다 (topic-proposal.md 기술 구조).

import type { Ingredient, Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

import type { Leftover, Meal, Result } from './types';

// 조합 탐색에 넣을 후보 수 상한. C(30, 5) = 142,506가지라 브라우저에서 바로 끝난다.
export const MAX_CANDIDATES = 30;
// 조합 하나에서 새로 사는 재료 가짓수의 기본 상한. 빈 냉장고로 "전부 사서 5가지"가 나오지 않게 한다.
// "약간"으로만 쓰는 재료(고명)는 세지 않는다. 0을 주면 "사지 않고 만들 수 있는 요리"가 된다.
export const MAX_PURCHASES = 3;

// 남는 양 점수에서 재료 보관 등급별 가중치. 빨리 상하는 재료가 남을수록 점수가 나빠진다.
// 값 자체에는 근거가 없고, 테스트 바구니로 비교해 정했다 (10/30, research-storage.md).
export const PERISH_WEIGHT: Record<string, number> = { '빨리 상함': 3, 보통: 1.5, '오래 감': 1 };

// 며칠 순서에서 등급을 견주는 값. 클수록 먼저 쓴다.
const URGENCY_RANK: Record<string, number> = { '빨리 상함': 3, 보통: 2, '오래 감': 1 };

const round1 = (n: number) => Math.round(n * 10) / 10;
const EPS = 1e-9;

type Need = { ingredientId: string; grams: number; vague: boolean };

function needs(recipe: Recipe, servings: number): Need[] {
  return recipe.ingredients.flatMap((i) =>
    i.grams === null ? [] : [{ ingredientId: i.ingredientId, grams: i.grams * servings, vague: i.vague }]
  );
}

function toStock(inventory: Stock[]): Map<string, number> {
  const stock = new Map<string, number>();
  for (const s of inventory) if (s.grams > 0) stock.set(s.ingredientId, (stock.get(s.ingredientId) ?? 0) + s.grams);
  return stock;
}

/**
 * 조합 탐색에 넣을 후보를 고른다 (PROJ1-39).
 * 가진 재료를 하나 이상 쓰고, 가진 재료는 가진 양 안에서만 쓰고, 혼자서도 maxPurchases가지 넘게 사지 않아도 되는 레시피만 남긴다.
 * 사야 할 g이 적은 레시피, 그다음 가진 재료를 많이 쓰는 레시피 순으로 MAX_CANDIDATES개까지 돌려준다.
 * 사지 않아도 되는 레시피가 앞에 오므로, 같은 후보로 recommend의 maxPurchases: 0도 쓸 수 있다.
 */
export function filterCandidates(
  recipes: Recipe[],
  inventory: Stock[],
  servings: number,
  maxPurchases = MAX_PURCHASES
): Recipe[] {
  const stock = toStock(inventory);
  const ranked = recipes.flatMap((r) => {
    const need = needs(r, servings);
    if (need.some((n) => stock.has(n.ingredientId) && n.grams > stock.get(n.ingredientId)! + EPS)) return [];
    const lack = need.filter((n) => !n.vague && !stock.has(n.ingredientId));
    const uses = need.filter((n) => stock.has(n.ingredientId));
    if (uses.length === 0 || lack.length > maxPurchases) return [];
    const share = uses.reduce((s, n) => s + n.grams / stock.get(n.ingredientId)!, 0);
    const buyGrams = lack.reduce((s, n) => s + n.grams, 0);
    return [{ r, buys: lack.length, buyGrams, share }];
  });
  ranked.sort((a, b) => a.buyGrams - b.buyGrams || a.buys - b.buys || b.share - a.share);
  return ranked.slice(0, MAX_CANDIDATES).map((x) => x.r);
}

type Score = { left: number; buyGrams: number };

/**
 * 가진 재료가 적게 남을수록, 그다음 사는 g이 적을수록 좋다.
 * left는 재료마다 남은 비율에 보관 등급 가중치를 곱해 더한 값이다. g 합으로 보면 무거운 재료(계란, 대파)만 줄이고
 * 가벼운 채소(숙주, 상추)는 그대로 남기는 조합이 뽑혀서 비율로 본다.
 */
function better(a: Score, b: Score): boolean {
  if (Math.abs(a.left - b.left) > 1e-6) return a.left < b.left;
  return a.buyGrams < b.buyGrams;
}

/**
 * 후보 레시피에서 요리 조합을 고른다 (PROJ1-41, PROJ1-40, PROJ1-42 최소 버전).
 *
 * 차감은 더하기라서 순서와 상관없이 고른 레시피들의 사용량 합으로 판단한다.
 * 가진 재료는 가진 양까지만 쓴다. 이미 있는 재료를 더 사라고 하지 않는다.
 * 없는 재료는 새로 산다. 사는 재료는 maxPurchases가지(기본 MAX_PURCHASES)까지다.
 * meals개짜리 조합을 모두 살펴보고 better()로 가장 좋은 것을 고른다. meals개를 만들 수 없으면 하나씩 줄여 다시 찾는다.
 */
export function recommend(
  inventory: Stock[],
  options: { meals: number; servings: number; maxPurchases?: number },
  data: { candidates: Recipe[]; ingredients: Ingredient[] }
): Result {
  const stock = toStock(inventory);
  const recipes = data.candidates;
  const maxPurchases = options.maxPurchases ?? MAX_PURCHASES;
  const weight = new Map(data.ingredients.map((i) => [i.id, PERISH_WEIGHT[i.perishability ?? ''] ?? 1]));

  let best: Recipe[] = [];
  for (let k = Math.min(options.meals, recipes.length); k > 0 && best.length === 0; k--) {
    best = searchBest(recipes, stock, k, options.servings, maxPurchases, weight);
  }

  const total = new Map<string, number>();
  const firm = new Set<string>(); // "약간"이 아닌 분량으로 한 번이라도 쓰는 재료
  for (const r of best) {
    for (const n of needs(r, options.servings)) {
      total.set(n.ingredientId, (total.get(n.ingredientId) ?? 0) + n.grams);
      if (!n.vague) firm.add(n.ingredientId);
    }
  }
  // 가진 재료는 가진 양 안에서만 쓰므로, 장보기에는 없는 재료만 들어간다
  const shoppingList = [...total]
    .filter(([id]) => !stock.has(id))
    .map(([id, g]) => ({ ingredientId: id, grams: round1(g), optional: !firm.has(id) }));
  const toBuy = new Set(shoppingList.map((s) => s.ingredientId));

  const grade = new Map(data.ingredients.map((i) => [i.id, i.perishability ?? null]));
  const special = new Set(data.ingredients.filter((i) => i.pantry === '특수').map((i) => i.id));
  const meals: Meal[] = best.map((r) => {
    const uses = needs(r, options.servings).map((n) => ({ ingredientId: n.ingredientId, grams: round1(n.grams) }));
    return {
      recipeId: r.id,
      name: r.name,
      uses,
      toBuy: uses.filter((u) => toBuy.has(u.ingredientId)).map((u) => u.ingredientId),
      pantryNeeded: r.ingredients.filter((i) => special.has(i.ingredientId)).map((i) => i.ingredientId),
      ...urgencyOf(uses, stock, grade),
      day: 0
    };
  });
  assignDays(meals);

  const leftovers: Leftover[] = [...stock].map(([id, g]) => ({
    ingredientId: id,
    startGrams: round1(g),
    leftGrams: round1(Math.max(0, g - (total.get(id) ?? 0)))
  }));
  const start = [...stock.values()].reduce((a, b) => a + b, 0);
  const remain = leftovers.reduce((a, l) => a + l.leftGrams, 0);

  return {
    status: meals.length === 0 ? 'empty' : meals.length < options.meals ? 'partial' : 'ok',
    meals,
    shoppingList,
    leftovers,
    leftoverRatio: start === 0 ? 0 : Math.round((remain / start) * 1000) / 1000
  };
}

/**
 * 요리가 쓰는 가진 재료 중 가장 빨리 상하는 등급과 그 등급의 재료를 돌려준다 (PROJ1-120).
 * 산 재료는 사 온 뒤 쓰므로 상하는 순서를 따질 때 세지 않는다. 같은 등급의 g 합은 assignDays가 동점을 가를 때 쓴다.
 */
function urgencyOf(
  uses: { ingredientId: string; grams: number }[],
  stock: Map<string, number>,
  grade: Map<string, Ingredient['perishability']>
): Pick<Meal, 'urgency' | 'urgentIngredients'> & { urgentGrams: number } {
  const owned = uses.filter((u) => stock.has(u.ingredientId) && URGENCY_RANK[grade.get(u.ingredientId) ?? '']);
  const top = Math.max(0, ...owned.map((u) => URGENCY_RANK[grade.get(u.ingredientId)!]));
  const hit = owned.filter((u) => URGENCY_RANK[grade.get(u.ingredientId)!] === top);
  return {
    urgency: top === 0 ? null : (grade.get(hit[0].ingredientId) as Meal['urgency']),
    urgentIngredients: hit.map((u) => u.ingredientId),
    urgentGrams: hit.reduce((s, u) => s + u.grams, 0)
  };
}

/**
 * 가장 빨리 상하는 등급이 높은 요리부터 1일째, 2일째… day를 붙인다. 같은 등급이면 그 등급 재료를 쓰는 g이 많은 요리가 먼저,
 * 그래도 같으면 meals 순서를 따른다. meals 배열은 정렬하지 않고 day만 붙인다.
 */
function assignDays(meals: (Meal & { urgentGrams?: number })[]) {
  const key = (m: Meal & { urgentGrams?: number }) => [URGENCY_RANK[m.urgency ?? ''] ?? 0, m.urgentGrams ?? 0];
  const order = meals
    .map((_, i) => i)
    .sort((a, b) => {
      const [ra, ga] = key(meals[a]);
      const [rb, gb] = key(meals[b]);
      return rb - ra || gb - ga || a - b;
    });
  order.forEach((i, n) => {
    meals[i].day = n + 1;
    delete meals[i].urgentGrams;
  });
}

/**
 * k개 조합 중 가진 재료를 넘겨 쓰지 않고, 사는 재료가 maxPurchases가지 이하이며, better()로 가장 좋은 것.
 * 없으면 빈 배열.
 */
function searchBest(
  recipes: Recipe[],
  stock: Map<string, number>,
  k: number,
  servings: number,
  maxPurchases: number,
  weight: Map<string, number>
): Recipe[] {
  const uses = recipes.map((r) => needs(r, servings));
  const used = new Map<string, number>();
  const firmCount = new Map<string, number>(); // 재료별로 "약간"이 아닌 분량으로 쓰는 레시피 수
  const chosen: number[] = [];
  let best: number[] = [];
  let bestScore: Score | null = null;

  // 가진 재료를 넘겨 쓰면 null. 아니면 사는 g 합.
  // 사는 가짓수는 없는 재료 중 "약간"이 아닌 분량으로 쓰는 것만 센다.
  const check = (): { buyGrams: number } | null => {
    let buys = 0;
    let buyGrams = 0;
    for (const [id, g] of used) {
      const have = stock.get(id);
      if (have !== undefined) {
        if (g > have + EPS) return null;
      } else if (firmCount.has(id)) {
        buys++;
        buyGrams += g;
      }
    }
    return buys <= maxPurchases ? { buyGrams } : null;
  };

  const add = (i: number, sign: 1 | -1) => {
    for (const n of uses[i]) {
      const g = (used.get(n.ingredientId) ?? 0) + sign * n.grams;
      if (g < EPS) used.delete(n.ingredientId);
      else used.set(n.ingredientId, g);
      if (!n.vague) {
        const c = (firmCount.get(n.ingredientId) ?? 0) + sign;
        if (c === 0) firmCount.delete(n.ingredientId);
        else firmCount.set(n.ingredientId, c);
      }
    }
  };

  const dfs = (from: number) => {
    if (chosen.length === k) {
      let left = 0;
      for (const [id, g] of stock) left += ((weight.get(id) ?? 1) * Math.max(0, g - (used.get(id) ?? 0))) / g;
      const s = { left, buyGrams: check()!.buyGrams };
      if (!bestScore || better(s, bestScore)) {
        bestScore = s;
        best = [...chosen];
      }
      return;
    }
    for (let i = from; i <= recipes.length - (k - chosen.length); i++) {
      add(i, 1);
      chosen.push(i);
      // 쓰는 양과 사는 가짓수는 레시피를 더할수록 줄지 않으므로, 넘으면 더 볼 필요가 없다
      if (check()) dfs(i + 1);
      chosen.pop();
      add(i, -1);
    }
  };
  dfs(0);
  return best.map((i) => recipes[i]);
}
