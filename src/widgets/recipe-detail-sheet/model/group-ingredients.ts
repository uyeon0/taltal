// 레시피 재료를 상세 시트의 무리로 나눈다. 사는 재료는 요리 카드와 같은 mealPurchases로 가른다.

import { mealPurchases, type Meal, type Result } from '@/features/find-meals';
import type { Recipe, RecipeIngredient } from '@/entities/recipe';

export type IngredientGroups = {
  /** 가진 재료. grams는 이 요리에 쓰는 양(인분을 곱한 값)이다 */
  owned: { ingredient: RecipeIngredient; grams: number }[];
  /** 따로 사야 하는 재료. grams는 이 요리에 쓰는 양이다 */
  toBuy: { ingredient: RecipeIngredient; grams: number }[];
  /** 있으면 좋은 재료(고명). 조금 가졌을 수 있어 양을 쓰지 않는다 */
  optional: RecipeIngredient[];
  /** g이 없는 양념. 원문 분량으로 쓴다 */
  seasonings: RecipeIngredient[];
};

/**
 * recipe.ingredients를 원문 순서대로 나눈다. 모든 재료가 한 무리에 한 번씩 들어간다.
 * role이 아니라 grams로 나눈다. role이 "양념"이어도 g이 있으면 Meal.uses에 들어 있어 가진 재료나 사는 재료다.
 */
export function groupIngredients(meal: Meal, recipe: Recipe, shoppingList: Result['shoppingList']): IngredientGroups {
  const { required, optional } = mealPurchases(meal, shoppingList);
  const buyGrams = new Map(required.map((item) => [item.ingredientId, item.grams]));
  const optionalIds = new Set(optional);
  const useGrams = new Map(meal.uses.map((use) => [use.ingredientId, use.grams]));

  const groups: IngredientGroups = { owned: [], toBuy: [], optional: [], seasonings: [] };
  for (const ingredient of recipe.ingredients) {
    const id = ingredient.ingredientId;
    if (ingredient.grams === null) groups.seasonings.push(ingredient);
    else if (buyGrams.has(id)) groups.toBuy.push({ ingredient, grams: buyGrams.get(id)! });
    else if (optionalIds.has(id)) groups.optional.push(ingredient);
    else groups.owned.push({ ingredient, grams: useGrams.get(id) ?? 0 });
  }
  return groups;
}
