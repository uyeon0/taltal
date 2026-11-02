import type { ReactNode } from 'react';
import { IngredientImage } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { AllocationSwatch, allocationBackground } from '@/shared/ui/allocation-swatch';
import { LabelTag } from '@/shared/ui/label-tag';
import { INTRO_EXAMPLE_GRAMS } from '../model/intro-example';

// 소개의 미리 보기. 실제 화면의 핵심 요소만 같은 모양으로 다시 그린 모형이고 입력을 받지 않는다.
// 세 장이 두부 예시 하나를 이어 쓴다(docs/requirements/onboarding.md "소개")

const { exampleIngredients, exampleMeals, exampleLeftover } = copy.intro;
const [mainIngredient] = exampleIngredients;

/**
 * 모형을 미리 보기 영역 가운데에 둔다.
 * 360px 휴대폰에서 장 제목이 두 줄이 되면 모형에 쓸 높이가 140px 안팎이라, 모형은 실제 화면보다 촘촘하게 그린다
 */
function PreviewFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col justify-center">{children}</div>;
}

/** 모형을 담는 Light 카드. 실제 화면에서 주황 바탕 위에 놓인 카드와 같은 모양이다 */
function PreviewCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('surface-default rounded-xl border border-foreground bg-card', className)}>{children}</div>;
}

/** 1장. 재료 입력의 담은 재료 목록 */
export function IngredientsPreview() {
  return (
    <PreviewFrame>
      <PreviewCard>
        <ul>
          {exampleIngredients.map((ingredient) => (
            <li
              key={ingredient.name}
              className="flex items-center gap-2 border-t-(length:--border-width-divider) px-3 py-1 first:border-t-0"
            >
              <IngredientImage ingredientId={ingredient.name} size={24} />
              <span className="min-w-0 flex-1 font-semibold">{ingredient.name}</span>
              <span className="text-xs font-semibold">{ingredient.amount}</span>
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
              className="flex flex-wrap items-center gap-x-2 border-t-(length:--border-width-divider) px-3 py-1 first:border-t-0"
            >
              <AllocationSwatch order={index + 1} />
              <LabelTag>{copy.mealCard.order(index + 1)}</LabelTag>
              <span className="font-bold">{meal.name}</span>
              <span className="text-xs">{`${mainIngredient.name} ${meal.amount}`}</span>
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
      <PreviewCard className="flex flex-col gap-1 px-3 py-2">
        <p className="flex items-center gap-2">
          <span className="min-w-0 flex-1 font-semibold">{`${mainIngredient.name} ${mainIngredient.amount}`}</span>
          <span className="text-xs font-semibold">{exampleLeftover}</span>
        </p>
        {/* 사용량 시트의 막대와 같은 모양이고 높이만 낮다. 남는 양은 Light 빈 면이다 */}
        <div className="flex h-4 overflow-hidden rounded-lg border border-foreground bg-allocation-remaining">
          {meals.map((grams, index) => (
            <span
              key={exampleMeals[index].name}
              className={cn('h-full shrink-0 border-r border-foreground', allocationBackground(index + 1))}
              style={{ width: `${(grams / start) * 100}%` }}
            />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-3 text-xs">
          {exampleMeals.map((meal, index) => (
            <li key={meal.name} className="flex items-center gap-1">
              <AllocationSwatch order={index + 1} />
              {`${meal.name} ${meal.amount}`}
            </li>
          ))}
        </ul>
      </PreviewCard>
    </PreviewFrame>
  );
}
