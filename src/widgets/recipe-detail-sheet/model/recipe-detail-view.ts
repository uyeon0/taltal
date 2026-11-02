// 레시피 상세에 보여 줄 값을 모두 만든다. 시트와 나중에 서버에서 그릴 레시피 이미지가 같은 값을 쓴다.
// 서버에서도 부를 수 있게 React, DOM, 클라이언트 전용 모듈을 import하지 않는다. 입력과 출력은 JSON으로 보낼 수 있는 값만 쓴다.

import type { Meal, Result } from '@/features/find-meals';
import { formatAmount, type Ingredient, type InputUnit } from '@/entities/ingredient';
import type { Recipe, RecipeDetail } from '@/entities/recipe';

import { groupIngredients } from './group-ingredients';

export type RecipeDetailView = {
  /** 요리 순서. 화면에서는 "N번째 요리"다 */
  day: number;
  name: string;
  /** 원문 조리 시간. 예: "40분" */
  cookingTime: string;
  /** 원문 인분. 원문 분량과 양념 분량의 기준이다 */
  servingsOriginal: number;
  /** 상세를 아직 받지 못했으면 null */
  summary: string | null;
  /** 가진 재료. amount는 사용자가 입력한 단위, originalAmount는 원문 분량이다 */
  owned: { name: string; amount: string; originalAmount: string }[];
  /** 따로 사야 하는 재료. amount는 재료의 기본 단위에 g을 함께 쓴다 */
  toBuy: { name: string; amount: string }[];
  /** 있으면 좋은 재료 이름 */
  optional: string[];
  /** 양념. amount는 원문 분량이다 */
  seasonings: { name: string; amount: string }[];
  /** no 순서로 정렬한 조리 과정. 상세를 아직 받지 못했으면 null */
  steps: RecipeDetail['steps'] | null;
};

/** 요리 카드와 같은 양 문자열. 재료 정보가 없으면 빈 문자열이다 */
function amountOf(
  ingredient: Ingredient | undefined,
  grams: number,
  unit: InputUnit | undefined,
  withGrams = false
): string {
  if (!ingredient) return '';
  return formatAmount(ingredient, grams, unit ?? ingredient.inputUnits[0] ?? 'g', { withGrams });
}

export function toRecipeDetailView(
  meal: Meal,
  shoppingList: Result['shoppingList'],
  recipe: Recipe,
  detail: RecipeDetail | null,
  ingredients: readonly Ingredient[],
  units: Readonly<Record<string, InputUnit>>
): RecipeDetailView {
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const groups = groupIngredients(meal, recipe, shoppingList);
  return {
    day: meal.day,
    name: meal.name,
    cookingTime: recipe.cookingTime,
    servingsOriginal: recipe.servingsOriginal,
    summary: detail?.summary ?? null,
    owned: groups.owned.map(({ ingredient, grams }) => ({
      name: ingredient.ingredientId,
      amount: amountOf(byId.get(ingredient.ingredientId), grams, units[ingredient.ingredientId]),
      originalAmount: ingredient.amountText
    })),
    toBuy: groups.toBuy.map(({ ingredient, grams }) => ({
      name: ingredient.ingredientId,
      amount: amountOf(byId.get(ingredient.ingredientId), grams, undefined, true)
    })),
    optional: groups.optional.map((ingredient) => ingredient.ingredientId),
    seasonings: groups.seasonings.map((ingredient) => ({
      name: ingredient.ingredientId,
      amount: ingredient.amountText
    })),
    steps: detail ? [...detail.steps].sort((a, b) => a.no - b.no) : null
  };
}
