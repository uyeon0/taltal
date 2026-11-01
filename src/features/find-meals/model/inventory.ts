// 후보 고르기(서버)와 묶음 고르기(브라우저)가 함께 쓰는 계산.

import type { Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

// 조합 하나에서 새로 사는 재료 가짓수의 기본 상한. 빈 냉장고로 "전부 사서 5가지"가 나오지 않게 한다.
// "약간"으로만 쓰는 재료(고명)는 세지 않는다. 0을 주면 "사지 않고 만들 수 있는 요리"가 된다.
export const MAX_PURCHASES = 3;

// g을 비교할 때 허용하는 오차
export const EPS = 1e-9;

export type Need = { ingredientId: string; grams: number; vague: boolean };

export function needs(recipe: Recipe, servings: number): Need[] {
  return recipe.ingredients.flatMap((i) =>
    i.grams === null ? [] : [{ ingredientId: i.ingredientId, grams: i.grams * servings, vague: i.vague }]
  );
}

export function toStock(inventory: Stock[]): Map<string, number> {
  const stock = new Map<string, number>();
  for (const s of inventory) if (s.grams > 0) stock.set(s.ingredientId, (stock.get(s.ingredientId) ?? 0) + s.grams);
  return stock;
}
