'use client';

import { ChevronRight } from 'lucide-react';
import { splitLeftovers, type Leftover, type Result } from '@/features/find-meals';
import { formatAmount, type Ingredient, type InputUnit } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { SHEET_OPENER_ATTR } from '@/shared/lib/use-sheet-route';
import { Button } from '@/shared/ui/button';

/** 사용량 시트를 여는 버튼의 data-sheet-opener 값 */
export const USAGE_OPENER = 'usage';

type ResultSummaryProps = {
  result: Result;
  /** 재료 id → 재료. 이름과 양 표시에 쓴다 */
  ingredients: ReadonlyMap<string, Ingredient>;
  /** 재료 id → 사용자가 고른 단위 */
  units: Readonly<Record<string, InputUnit>>;
  onOpenUsage: (opener: HTMLElement) => void;
};

/** 다 쓰는 재료와 남는 재료. 1g 아래로 남은 재료는 다 쓴 것으로 센다 */
export function ResultSummary({ result, ingredients, units, onOpenUsage }: ResultSummaryProps) {
  const { usedUp, remaining } = splitLeftovers(result.leftovers);

  const leftoverText = (leftover: Leftover) => {
    const ingredient = ingredients.get(leftover.ingredientId);
    if (!ingredient) return leftover.ingredientId;
    const unit = units[leftover.ingredientId] ?? ingredient.inputUnits[0] ?? 'g';
    return `${leftover.ingredientId} ${formatAmount(ingredient, leftover.leftGrams, unit)}`;
  };

  return (
    <section className="surface-brand flex flex-col gap-3 rounded-xl border border-foreground p-(--card-padding)">
      {usedUp.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold">{copy.results.summaryUsedUp(usedUp.length)}</p>
          <p className="break-keep">{usedUp.map((leftover) => leftover.ingredientId).join(', ')}</p>
        </div>
      ) : null}
      {remaining.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold">{copy.results.summaryLeftover(remaining.length)}</p>
          <p className="break-keep">{remaining.map(leftoverText).join(', ')}</p>
        </div>
      ) : (
        <p className="text-xl font-semibold">{copy.results.summaryNoLeftover}</p>
      )}
      <Button
        variant="secondary"
        className="w-full"
        onClick={(event) => onOpenUsage(event.currentTarget)}
        {...{ [SHEET_OPENER_ATTR]: USAGE_OPENER }}
      >
        {copy.results.openUsage}
        <ChevronRight aria-hidden="true" />
      </Button>
    </section>
  );
}
