// 요리 하나에서 사야 하는 재료와 있으면 좋은 재료를 나눈다. 요리 카드와 레시피 상세 시트가 같은 값을 쓰게 한다.

import type { Meal, Result } from './types';

export type MealPurchases = {
  /** 꼭 사야 하는 재료. grams는 이 요리에 쓰는 양이다. 가진 양이 없는 재료라 사는 양과 같다 */
  required: { ingredientId: string; grams: number }[];
  /** 있으면 좋은 재료(고명). 조금 가졌을 수 있어 양을 쓰지 않는다 */
  optional: string[];
};

/** meal.toBuy를 shoppingList의 optional로 나눈다. 순서는 meal.toBuy를 따른다 */
export function mealPurchases(meal: Meal, shoppingList: Result['shoppingList']): MealPurchases {
  const optional = new Map(shoppingList.map((item) => [item.ingredientId, item.optional]));
  const grams = new Map(meal.uses.map((use) => [use.ingredientId, use.grams]));
  const result: MealPurchases = { required: [], optional: [] };
  for (const id of meal.toBuy) {
    if (optional.get(id) ?? false) result.optional.push(id);
    else result.required.push({ ingredientId: id, grams: grams.get(id) ?? 0 });
  }
  return result;
}
