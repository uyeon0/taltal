// 후보 고르기(서버)와 묶음 고르기(브라우저)가 함께 쓰는 계산.

import type { Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

// 조합 하나에서 새로 사는 재료 가짓수의 기본 상한. 빈 냉장고로 "전부 사서 5가지"가 나오지 않게 한다.
// "약간"으로만 쓰는 재료(고명)는 세지 않는다. 0을 주면 "사지 않고 만들 수 있는 요리"가 된다.
export const MAX_PURCHASES = 3;

// g을 비교할 때 허용하는 오차
export const EPS = 1e-9;

export type Need = { ingredientId: string; grams: number; vague: boolean };

/**
 * 레시피가 쓰는 재료와 양(servings를 곱한 g). 양념(grams가 null)은 뺀다.
 * 같은 재료가 여러 줄이면 g을 합친다. 모든 줄이 "약간"일 때만 고명(vague)으로 본다.
 * 데이터는 같은 재료를 한 줄로 합쳐 오지만, 계산이 그 약속에만 기대지 않게 여기서도 합친다.
 */
export function needs(recipe: Recipe, servings: number): Need[] {
  const merged = new Map<string, Need>();
  for (const i of recipe.ingredients) {
    if (i.grams === null) continue;
    const prev = merged.get(i.ingredientId);
    const grams = i.grams * servings;
    if (prev) merged.set(i.ingredientId, { ...prev, grams: prev.grams + grams, vague: prev.vague && i.vague });
    else merged.set(i.ingredientId, { ingredientId: i.ingredientId, grams, vague: i.vague });
  }
  return [...merged.values()];
}

export function toStock(inventory: Stock[]): Map<string, number> {
  const stock = new Map<string, number>();
  for (const s of inventory) if (s.grams > 0) stock.set(s.ingredientId, (stock.get(s.ingredientId) ?? 0) + s.grams);
  return stock;
}
