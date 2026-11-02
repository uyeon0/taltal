'use client';

import { ChevronRight, ShoppingBasket } from 'lucide-react';
import { mealPurchases, type Meal, type Result } from '@/features/find-meals';
import { IngredientImage, formatAmount, type Ingredient, type InputUnit } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';
import { copy } from '@/shared/copy';
import { SHEET_OPENER_ATTR } from '@/shared/lib/use-sheet-route';
import { AllocationSwatch } from '@/shared/ui/allocation-swatch';
import { LabelTag } from '@/shared/ui/label-tag';

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
 * 요리 카드 목록. day 순서로 보여 준다. 고를 수 있는 후보처럼 보이지 않게 체크나 선택 표시를 두지 않고,
 * 순서 번호와 배분색으로 한 묶음의 요리라는 것을 보여 준다. 요리들은 카드 하나에 담고 줄 사이를 장식 구분선으로 나눈다.
 * 누르면 레시피 상세를 연다.
 */
export function MealList({ result, onOpenMeal, ...rest }: MealListProps) {
  const meals = [...result.meals].sort((a, b) => a.day - b.day);

  return (
    <ol className="surface-default flex flex-col rounded-xl border border-foreground bg-card">
      {meals.map((meal) => (
        <li key={meal.recipeId} className="border-t-(length:--border-width-divider) first:border-t-0">
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
        {/* 위계: 요리명(20px 700)만 굵게 두고, 순서는 라벨 태그, 이유와 조리 시간, 부가 정보는 14px로 낮춘다 */}
        <span className="flex flex-wrap items-center gap-2 text-xs font-medium break-keep">
          <AllocationSwatch order={meal.day} />
          <LabelTag>{copy.mealCard.order(meal.day)}</LabelTag>
          {meal.urgency === '빨리 상함' && meal.urgentIngredients.length > 0 ? (
            <>
              {/* flex 안의 공백은 보이지 않고, 화면 읽기 프로그램이 순서와 이유를 띄어 읽게 한다 */}{' '}
              <span>{copy.mealCard.orderReason(meal.urgentIngredients.join(', '))}</span>
            </>
          ) : null}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xl font-bold break-keep">{meal.name}</span>
          {cookingTime ? <span className="text-xs">{copy.mealCard.cookingTime(cookingTime)}</span> : null}
        </span>
        {owned.length > 0 ? (
          <>
            <span className="flex flex-wrap gap-1">
              {owned.map((use) => (
                <IngredientImage key={use.ingredientId} ingredientId={use.ingredientId} size={48} />
              ))}
            </span>
            <span className="break-keep">
              {owned
                .map((use) => `${use.ingredientId} ${amount(use.ingredientId, use.grams, units[use.ingredientId])}`)
                .join(' · ')}
            </span>
          </>
        ) : null}
        {required.length > 0 ? (
          <span className="flex items-start gap-2 break-keep">
            <ShoppingBasket aria-hidden="true" className="size-6 shrink-0" />
            {copy.mealCard.toBuy(
              required
                .map(
                  (item) =>
                    `${item.ingredientId} ${amount(item.ingredientId, item.grams, defaultUnit(item.ingredientId), true)}`
                )
                .join(', ')
            )}
          </span>
        ) : null}
        {optional.length > 0 ? (
          <span className="text-xs break-keep">
            <span className="font-bold">{copy.mealCard.optionalLabel}</span>: {optional.join(', ')}
          </span>
        ) : null}
        {meal.pantryNeeded.length > 0 ? (
          <span className="text-xs break-keep">
            <span className="font-bold">{copy.mealCard.specialSeasoningLabel}</span>: {meal.pantryNeeded.join(', ')}
          </span>
        ) : null}
      </span>
      <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0" />
    </button>
  );
}
