'use client';

import { useId, useState } from 'react';
import type { Meal, Result } from '@/features/find-meals';
import type { Ingredient, InputUnit } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';
import { copy } from '@/shared/copy';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { LoadingStatus } from '@/shared/ui/loading-status';
import { StatusMessage } from '@/shared/ui/status-message';
import { toRecipeDetailView } from '../model/recipe-detail-view';
import { recipeImageFileName, toRecipeImageRequest } from '../model/save-recipe-image';
import { useRecipeDetail } from '../model/use-recipe-detail';
import { useSaveRecipeImage } from '../model/use-save-recipe-image';
import { RecipeDetailContent } from './recipe-detail-content';

type RecipeDetailSheetProps = {
  /** 열고 닫는 상태. 결과 화면이 useSheetRoute(RECIPE_DETAIL_SHEET)로 갖는다 */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 지금 보는 묶음과 탭에서 연 요리. 새 결과에 그 요리가 없으면 null이다 */
  meal: Meal | null;
  /** 후보 레시피 중 연 요리의 레시피 */
  recipe: Recipe | null;
  shoppingList: Result['shoppingList'];
  /** 양념까지 모든 재료 */
  ingredients: Ingredient[];
  /** 재료 id → 사용자가 고른 단위 */
  units: Record<string, InputUnit>;
};

type Shown = { meal: Meal; recipe: Recipe; shoppingList: Result['shoppingList'] };

/**
 * 레시피 상세 시트. 순서, 이름, 조리 시간, 재료는 결과 데이터로 바로 그리고, 요약과 만드는 법은 열 때 받는다.
 * 탭을 바꿔 meal이 null이 되거나 닫히는 동안에도 마지막으로 받은 요리를 그대로 보여 준다.
 */
export function RecipeDetailSheet({
  open,
  onOpenChange,
  meal,
  recipe,
  shoppingList,
  ingredients,
  units
}: RecipeDetailSheetProps) {
  const [shown, setShown] = useState<Shown | null>(null);
  if (meal && recipe && (shown?.meal !== meal || shown.recipe !== recipe || shown.shoppingList !== shoppingList)) {
    setShown({ meal, recipe, shoppingList });
  }

  const state = useRecipeDetail(shown?.meal.recipeId ?? null, open);
  const saveImage = useSaveRecipeImage(
    shown
      ? {
          recipeId: shown.meal.recipeId,
          fileName: recipeImageFileName(shown.meal.name),
          body: toRecipeImageRequest(shown.meal, shown.shoppingList, units)
        }
      : null,
    open
  );
  const errorId = useId();
  const view = shown
    ? toRecipeDetailView(
        shown.meal,
        shown.shoppingList,
        shown.recipe,
        state.status === 'ready' ? state.detail : null,
        ingredients,
        units
      )
    : null;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        view ? (
          <span className="flex flex-col gap-1">
            <span className="text-xs font-medium">{copy.mealCard.order(view.day)}</span>
            {/* 요리 이름이 시트에서 가장 크다. 절 제목(20px)보다 한 단계 위인 24px로 둔다 */}
            <span className="text-2xl break-keep">{view.name}</span>
          </span>
        ) : (
          copy.recipeSheet.ingredientsTitle
        )
      }
      // 요리 카드처럼 조리 시간은 Ink로 쓴다. 시트 설명의 기본 색은 Muted다
      description={
        view ? <span className="text-foreground">{copy.mealCard.cookingTime(view.cookingTime)}</span> : undefined
      }
      footer={
        view ? (
          <div className="flex flex-col gap-2">
            {saveImage.status === 'error' ? (
              <StatusMessage id={errorId} tone="error" title={copy.recipeSheet.saveImageError} />
            ) : null}
            <Button
              size="primary"
              className="w-full"
              // 요약과 만드는 법을 받은 뒤에만 저장할 수 있다
              disabled={state.status !== 'ready'}
              loading={saveImage.status === 'saving'}
              aria-describedby={saveImage.status === 'error' ? errorId : undefined}
              onClick={saveImage.save}
            >
              {saveImage.status === 'saving' ? copy.recipeSheet.savingImage : copy.recipeSheet.saveImage}
            </Button>
          </div>
        ) : undefined
      }
    >
      {view && shown ? (
        <RecipeDetailContent
          // 다른 요리를 열면 원문 분량 펼침을 처음 상태로 돌린다
          key={shown.recipe.id}
          view={view}
          pending={
            state.status === 'error' ? (
              <StatusMessage tone="error" title={copy.recipeSheet.error} />
            ) : (
              <LoadingStatus
                phrases={[copy.recipeSheet.loading]}
                announcement={copy.recipeSheet.loading}
                className="py-4"
              />
            )
          }
        />
      ) : null}
    </BottomSheet>
  );
}
