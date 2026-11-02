'use client';

import { ChevronRight, ShoppingBasket } from 'lucide-react';
import { mealPurchases, type Meal, type Result } from '@/features/find-meals';
import { IngredientImage, formatAmount, type Ingredient, type InputUnit } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';
import { copy } from '@/shared/copy';
import { SHEET_OPENER_ATTR } from '@/shared/lib/use-sheet-route';
import { AllocationSwatch } from '@/shared/ui/allocation-swatch';

/** 요리 카드의 data-sheet-opener 값. 탭이나 묶음을 바꿔 다시 그려져도 같은 요리 카드로 포커스를 돌려준다 */
export const mealOpener = (recipeId: number) => `recipe-${recipeId}`;

type MealListProps = {
  result: Result;
  /** 레시피 id → 후보 레시피. 조리 시간에 쓴다 */
  recipes: ReadonlyMap<number, Recipe>;
  /** 재료 id → 재료. 이름과 양 표시에 쓴다 */
  ingredients: ReadonlyMap<string, Ingredient>;
  /** 재료 id → 사용자가 고른 단위 */
  units: Readonly<Record<string, InputUnit>>;
  onOpenMeal: (meal: Meal, opener: HTMLElement) => void;
};

/**
 * 요리 카드 목록. day 순서로 보여 준다. 고를 수 있는 후보처럼 보이지 않게 카드 하나 안에 요리를 구분선으로 나눈다.
 * 누르면 레시피 상세를 연다.
 */
export function MealList({ result, onOpenMeal, ...rest }: MealListProps) {
  const meals = [...result.meals].sort((a, b) => a.day - b.day);

  return (
    <ol className="flex flex-col divide-y divide-border rounded-xl border border-foreground bg-card">
      {meals.map((meal) => (
        <li key={meal.recipeId}>
          <MealCard meal={meal} shoppingList={result.shoppingList} onOpen={onOpenMeal} {...rest} />
        </li>
      ))}
    </ol>
  );
}

type MealCardProps = Omit<MealListProps, 'result' | 'onOpenMeal'> & {
  meal: Meal;
  shoppingList: Result['shoppingList'];
  onOpen: MealListProps['onOpenMeal'];
};

function MealCard({ meal, shoppingList, recipes, ingredients, units, onOpen }: MealCardProps) {
  const { required, optional } = mealPurchases(meal, shoppingList);
  const owned = meal.uses.filter((use) => !meal.toBuy.includes(use.ingredientId));
  const cookingTime = recipes.get(meal.recipeId)?.cookingTime;

  const amount = (ingredientId: string, grams: number, unit: InputUnit | undefined, withGrams = false) => {
    const ingredient = ingredients.get(ingredientId);
    if (!ingredient) return '';
    return formatAmount(ingredient, grams, unit ?? ingredient.inputUnits[0] ?? 'g', { withGrams });
  };
  const defaultUnit = (ingredientId: string) => ingredients.get(ingredientId)?.inputUnits[0];

  return (
    <button
      type="button"
      onClick={(event) => onOpen(meal, event.currentTarget)}
      className="flex w-full items-start gap-3 p-(--card-padding) text-left hover:text-action-hover"
      {...{ [SHEET_OPENER_ATTR]: mealOpener(meal.recipeId) }}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <AllocationSwatch order={meal.day} />
          {copy.mealCard.order(meal.day)}
        </span>
        {meal.urgency === '빨리 상함' && meal.urgentIngredients.length > 0 ? (
          <span className="text-sm">{copy.mealCard.orderReason(meal.urgentIngredients.join(', '))}</span>
        ) : null}
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xl font-semibold break-keep">{meal.name}</span>
          {cookingTime ? <span className="text-sm">{copy.mealCard.cookingTime(cookingTime)}</span> : null}
        </span>
        {owned.length > 0 ? (
          <>
            <span className="flex flex-wrap gap-1">
              {owned.map((use) => (
                <IngredientImage key={use.ingredientId} ingredientId={use.ingredientId} size={32} />
              ))}
            </span>
            <span className="break-keep">
              {owned
                .map((use) => `${use.ingredientId} ${amount(use.ingredientId, use.grams, units[use.ingredientId])}`)
                .join(' · ')}
            </span>
          </>
        ) : null}
        {required.map((item) => (
          <span key={item.ingredientId} className="flex items-start gap-2 font-semibold break-keep">
            <ShoppingBasket aria-hidden="true" className="size-6 shrink-0" />
            {copy.mealCard.toBuy(
              item.ingredientId,
              amount(item.ingredientId, item.grams, defaultUnit(item.ingredientId), true)
            )}
          </span>
        ))}
        {optional.length > 0 ? (
          <span className="text-sm break-keep">{copy.mealCard.optional(optional.join(', '))}</span>
        ) : null}
        {meal.pantryNeeded.length > 0 ? (
          <span className="text-sm break-keep">{copy.mealCard.specialSeasoning(meal.pantryNeeded.join(', '))}</span>
        ) : null}
      </span>
      <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0" />
    </button>
  );
}
