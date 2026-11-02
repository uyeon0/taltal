import type { Ingredient } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

export type PickableIngredients = {
  /** 사용자가 고르는 재료(pantry가 null). 레시피에 많이 나오는 순서, 같으면 가나다순 */
  pickable: Ingredient[];
  /** 있다고 보고 계산하는 기본 양념 이름. 가나다순 */
  pantryBasics: string[];
  /** 양념(pantry가 "기본"이나 "특수"). 시트에서 양념을 검색했을 때 안내하려고 둔다. 데이터 순서 */
  seasonings: Ingredient[];
};

const byName = (a: string, b: string) => a.localeCompare(b, 'ko');

/** 재료 선택 격자의 순서와 기본 양념 목록을 만든다 */
export function orderPickable(ingredients: Ingredient[], recipes: Recipe[]): PickableIngredients {
  const recipeCount = new Map<string, number>();
  for (const recipe of recipes) {
    // 한 레시피에는 같은 재료가 한 줄만 있다(docs/data-contract.md "레시피")
    for (const { ingredientId } of recipe.ingredients) {
      recipeCount.set(ingredientId, (recipeCount.get(ingredientId) ?? 0) + 1);
    }
  }
  const count = (id: string) => recipeCount.get(id) ?? 0;

  return {
    pickable: ingredients
      .filter((ingredient) => ingredient.pantry === null)
      .sort((a, b) => count(b.id) - count(a.id) || byName(a.id, b.id)),
    pantryBasics: ingredients
      .filter((ingredient) => ingredient.pantry === '기본')
      .map((ingredient) => ingredient.id)
      .sort(byName),
    seasonings: ingredients.filter((ingredient) => ingredient.pantry !== null)
  };
}
