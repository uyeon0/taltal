'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MealList } from '@/widgets/meal-list';
import { RECIPE_DETAIL_SHEET, RecipeDetailSheet } from '@/widgets/recipe-detail-sheet';
import { ResultSummary } from '@/widgets/result-summary';
import { USAGE_SHEET, UsageSheet } from '@/widgets/usage-sheet';
import { USED_UP_GRAMS, shouldSuggestBuy, type MealSearch, type Mode } from '@/features/find-meals';
import type { Ingredient, InputUnit } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { useSheetRoute } from '@/shared/lib/use-sheet-route';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Mascot } from '@/shared/ui/mascot';
import { StatusMessage } from '@/shared/ui/status-message';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

type ResultsViewProps = {
  search: MealSearch;
  /** 양념까지 모든 재료 */
  ingredients: Ingredient[];
  /** 재료 id → 사용자가 고른 단위 */
  units: Record<string, InputUnit>;
  servings: number;
};

const bestDishes = (search: MealSearch, mode: Mode) => {
  const { options, best } = search.options[mode];
  return options[best]?.dishes ?? 0;
};

/**
 * 추천 결과. 처음에는 사지 않는 묶음을 보여 주고, 없으면 조금 사는 묶음을 이유와 함께 보여 준다.
 * 묶음을 바꾸면 그 묶음에서 가짓수가 가장 많은 탭을 고른다.
 */
export function ResultsView({ search, ingredients, units, servings }: ResultsViewProps) {
  const noBuyAvailable = search.options.noBuy.options.length > 0;
  const [mode, setMode] = useState<Mode>(noBuyAvailable ? 'noBuy' : 'buy');
  const [dishes, setDishes] = useState(() => bestDishes(search, noBuyAvailable ? 'noBuy' : 'buy'));
  // 묶음을 바꾼 뒤 다음 그림에서 제목으로 포커스를 옮길지
  const focusTitleRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tabsLabelId = useId();

  const usageSheet = useSheetRoute(USAGE_SHEET);
  const recipeSheet = useSheetRoute(RECIPE_DETAIL_SHEET);
  // 연 요리. 지금 결과의 요리와 후보 레시피를 이 값으로 찾는다
  const [recipeId, setRecipeId] = useState<number | null>(null);

  const ingredientMap = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const recipeMap = useMemo(() => new Map(search.candidates.map((r) => [r.id, r])), [search.candidates]);

  const comparison = search.options[mode];
  const option = comparison.options.find((o) => o.dishes === dishes) ?? comparison.options[comparison.best];
  const result = option.result;
  const suggestBuy = mode === 'noBuy' && shouldSuggestBuy(search.options.noBuy, search.options.buy);

  const allUsed = result.leftovers.every((leftover) => leftover.leftGrams < USED_UP_GRAMS);
  const title =
    mode === 'buy' ? copy.results.titleWithPurchase : allUsed ? copy.results.titleAllUsed : copy.results.title;

  // 묶음을 바꾸면 누른 버튼이 사라지므로 제목으로 포커스를 옮기고 맨 위로 올린다
  useEffect(() => {
    if (!focusTitleRef.current) return;
    focusTitleRef.current = false;
    window.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [mode]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setDishes(bestDishes(search, next));
    focusTitleRef.current = true;
  };

  return (
    <main className="flex flex-col gap-6 px-(--page-gutter) pt-2 pb-12">
      <div className="flex items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 ref={titleRef} tabIndex={-1} className="font-display text-display-sm break-keep">
            {title}
          </h1>
          <p className="font-semibold">{copy.results.servings(servings)}</p>
        </div>
        <Mascot pose="meal" size={112} priority />
      </div>

      {!noBuyAvailable ? <StatusMessage tone="info" title={copy.purchaseMode.noPurchaseUnavailable} /> : null}
      {mode === 'buy' && noBuyAvailable ? (
        <Button variant="secondary" className="w-full" onClick={() => switchMode('noBuy')}>
          {copy.purchaseMode.backToNoPurchase}
        </Button>
      ) : null}

      <Tabs
        value={String(option.dishes)}
        onValueChange={(value) => setDishes(Number(value))}
        className="flex flex-col gap-3"
      >
        <p id={tabsLabelId} className="text-xl font-semibold">
          {copy.results.dishCountLabel}
        </p>
        <TabsList aria-labelledby={tabsLabelId}>
          {comparison.options.map((o) => (
            <TabsTrigger key={o.dishes} value={String(o.dishes)}>
              {copy.results.dishCountTab(o.dishes)}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* 패널 안에 누를 수 있는 버튼이 있어 패널 자체는 Tab 정지점이 아니다 */}
        <TabsContent value={String(option.dishes)} tabIndex={-1} className="flex flex-col gap-6">
          <ResultSummary
            result={result}
            ingredients={ingredientMap}
            units={units}
            onOpenUsage={(opener) => usageSheet.openSheet(opener)}
          />
          <MealList
            result={result}
            recipes={recipeMap}
            ingredients={ingredientMap}
            units={units}
            onOpenMeal={(meal, opener) => {
              setRecipeId(meal.recipeId);
              recipeSheet.openSheet(opener);
            }}
          />
        </TabsContent>
      </Tabs>

      {suggestBuy ? (
        // Light 카드 안이라 주요 버튼이 Primary 면이다
        <Card>
          <h2 className="text-xl font-semibold">{copy.purchaseMode.suggestTitle}</h2>
          <Button className="w-full" onClick={() => switchMode('buy')}>
            {copy.purchaseMode.suggestButton}
          </Button>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">{copy.results.estimateNotice}</p>

      <UsageSheet
        open={usageSheet.open}
        onOpenChange={usageSheet.onOpenChange}
        result={result}
        ingredients={ingredientMap}
        units={units}
      />
      <RecipeDetailSheet
        open={recipeSheet.open}
        onOpenChange={recipeSheet.onOpenChange}
        meal={result.meals.find((meal) => meal.recipeId === recipeId) ?? null}
        recipe={recipeId === null ? null : (recipeMap.get(recipeId) ?? null)}
        shoppingList={result.shoppingList}
        ingredients={ingredients}
        units={units}
      />
    </main>
  );
}
