import 'server-only';

// 가진 재료로 묶음 탐색에 넣을 후보 레시피를 고른다. 서버에서만 쓴다. 레시피 전체를 브라우저로 보내지 않기 위해서다.

import type { Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

import { EPS, MAX_PURCHASES, needs, toStock } from './inventory';

// 조합 탐색에 넣을 후보 수 상한. C(30, 5) = 142,506가지라 브라우저에서 바로 끝난다.
export const MAX_CANDIDATES = 30;

/**
 * 조합 탐색에 넣을 후보를 고른다.
 * 가진 재료를 고명이 아닌 분량으로 하나 이상 쓰고, 가진 재료는 가진 양 안에서만 쓰고, 혼자서도 maxPurchases가지 넘게 사지 않아도 되는 레시피만 남긴다.
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
    // 가진 양을 넘으면 빼되, 고명("약간")은 모자라도 빼지 않는다. 모자란 만큼은 장보기에 "있으면 좋음"으로 들어간다
    if (need.some((n) => !n.vague && stock.has(n.ingredientId) && n.grams > stock.get(n.ingredientId)! + EPS))
      return [];
    const lack = need.filter((n) => !n.vague && !stock.has(n.ingredientId));
    const uses = need.filter((n) => stock.has(n.ingredientId));
    // 가진 재료를 고명("약간")으로만 쓰는 레시피는 가진 재료를 쓴다고 보지 않는다
    if (!uses.some((n) => !n.vague) || lack.length > maxPurchases) return [];
    const share = uses.reduce((s, n) => s + n.grams / stock.get(n.ingredientId)!, 0);
    const buyGrams = lack.reduce((s, n) => s + n.grams, 0);
    return [{ r, buys: lack.length, buyGrams, share }];
  });
  ranked.sort((a, b) => a.buyGrams - b.buyGrams || a.buys - b.buys || b.share - a.share);
  return ranked.slice(0, MAX_CANDIDATES).map((x) => x.r);
}
