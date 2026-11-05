import type { ReactNode } from 'react';
import { IngredientImage } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { AllocationSwatch, allocationBackground } from '@/shared/ui/allocation-swatch';
import { INTRO_EXAMPLE_GRAMS, INTRO_EXAMPLE_MORE_RATIOS } from '../model/intro-example';

// 소개의 미리 보기. 실제 화면의 핵심 요소만 같은 모양으로 다시 그린 모형이고 입력을 받지 않는다.
// 세 장이 두부 예시 하나를 이어 쓴다(docs/requirements/onboarding.md "소개")

const { exampleIngredients, exampleMeals, exampleLeftover, exampleMoreUsage } = copy.intro;
const [mainIngredient] = exampleIngredients;

/**
 * 모든 화면이 같은 정보를 보여 준다. 낮은 화면은 촘촘하게, 높은 화면(tall)은 같은 내용을 크게 그린다.
 */
function PreviewFrame({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col justify-center">{children}</div>;
}

/** 모형을 담는 Light 카드. 실제 화면에서 주황 바탕 위에 놓인 카드와 같은 모양이다 */
function PreviewCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('surface-default rounded-xl border border-foreground bg-card', className)}>{children}</div>;
}

/** 1장. 재료 입력의 담은 재료 목록과 인분 */
export function IngredientsPreview() {
  return (
    <PreviewFrame>
      <PreviewCard>
        {/* 머리 줄*/}
        <p className="flex items-center border-b-(length:--border-width-divider) px-3 py-1 text-xs font-semibold tall:px-4 tall:py-2 tall:text-sm">
          <span className="flex-1">{copy.intro.exampleListLabel(exampleIngredients.length)}</span>
          {copy.ingredients.servingsOption(2)}
        </p>
        <ul>
          {exampleIngredients.map((ingredient) => (
            <li
              key={ingredient.name}
              className="flex items-center gap-2 border-t-(length:--border-width-divider) px-3 py-1 first:border-t-0 tall:gap-3 tall:px-4 tall:py-2"
            >
              <IngredientImage ingredientId={ingredient.name} size={40} className="size-7 tall:size-9" />
              <span className="min-w-0 flex-1 font-bold tall:text-lg">{ingredient.name}</span>
              <span className="text-sm font-bold tall:text-base">{ingredient.amount}</span>
            </li>
          ))}
        </ul>
      </PreviewCard>
    </PreviewFrame>
  );
}

/** 2장. 추천 결과의 요리 묶음 */
export function MealsPreview() {
  return (
    <PreviewFrame>
      <PreviewCard>
        <ol>
          {exampleMeals.map((meal, index) => (
            <li
              key={meal.name}
              className="flex flex-col border-t-(length:--border-width-divider) px-3 py-1 first:border-t-0 tall:gap-1 tall:px-4 tall:py-2"
            >
              <span className="flex items-center gap-2 font-bold tall:gap-3 tall:text-lg">
                <AllocationSwatch order={index + 1} className="size-4 border-2 tall:size-5" />
                {meal.name}
              </span>
              <span className="pl-6 text-xs tall:pl-8 tall:text-sm">
                {[`${mainIngredient.name} ${meal.amount}`, ...meal.others].join(' · ')}
              </span>
            </li>
          ))}
        </ol>
      </PreviewCard>
    </PreviewFrame>
  );
}

/** 3장. 사용량 시트의 재료 한 줄을 펼친 모습. 배분 표시는 Light 면 위에 놓는다 */
export function UsagePreview() {
  const { start, meals } = INTRO_EXAMPLE_GRAMS;
  return (
    <PreviewFrame>
      <PreviewCard className="flex flex-col gap-1 px-3 py-2 tall:gap-2 tall:px-4 tall:py-3">
        <p className="flex items-center gap-2">
          <span className="min-w-0 flex-1 font-semibold">{`${mainIngredient.name} ${mainIngredient.amount}`}</span>
          <span className="text-xs font-semibold">{exampleLeftover}</span>
        </p>
        {/* 사용량 시트의 막대와 같은 모양이고 높이만 낮다. 남는 양은 Light 빈 면이다 */}
        <div className="flex h-3 overflow-hidden rounded-lg border tall:h-6 border-foreground bg-allocation-remaining">
          {meals.map((grams, index) => (
            <span
              key={exampleMeals[index].name}
              className={cn('h-full shrink-0 border-r border-foreground', allocationBackground(index + 1))}
              style={{ width: `${(grams / start) * 100}%` }}
            />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-3 text-xs tall:text-sm">
          {exampleMeals.map((meal, index) => (
            <li key={meal.name} className="flex items-center gap-1">
              <AllocationSwatch order={index + 1} />
              {meal.name}
            </li>
          ))}
        </ul>
        {exampleMoreUsage.map((usage, row) => (
          <div key={usage.name} className="flex flex-col gap-1 border-t-(length:--border-width-divider) pt-1 tall:pt-2">
            <p className="flex items-center gap-2">
              <span className="min-w-0 flex-1 font-semibold">{usage.name}</span>
              <span className="text-xs font-semibold">{usage.leftover}</span>
            </p>
            <div className="flex h-3 overflow-hidden rounded-lg border tall:h-6 border-foreground bg-allocation-remaining">
              {INTRO_EXAMPLE_MORE_RATIOS[row].map((ratio, index) =>
                ratio > 0 ? (
                  <span
                    key={exampleMeals[index].name}
                    className={cn('h-full shrink-0 border-r border-foreground', allocationBackground(index + 1))}
                    style={{ width: `${ratio * 100}%` }}
                  />
                ) : null
              )}
            </div>
          </div>
        ))}
      </PreviewCard>
    </PreviewFrame>
  );
}
