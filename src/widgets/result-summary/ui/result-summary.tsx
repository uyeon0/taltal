'use client';

import { ChevronRight } from 'lucide-react';
import { splitLeftovers, type Leftover, type Result } from '@/features/find-meals';
import { formatAmount, type Ingredient, type InputUnit } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { SHEET_OPENER_ATTR } from '@/shared/lib/use-sheet-route';
import { Button } from '@/shared/ui/button';
import { LabelTag } from '@/shared/ui/label-tag';

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

  // 사선 모서리 카드(.summary-card)는 바깥 Ink 면 안에 Light 면을 겹쳐 그리므로 안쪽 div가 실제 카드 면이다
  return (
    <section className="summary-card">
      <div className="surface-default flex flex-col gap-3 p-(--card-padding)">
        {usedUp.length > 0 ? (
          <SummaryGroup
            label={copy.results.summaryUsedUpLabel}
            count={usedUp.length}
            items={usedUp.map((leftover) => leftover.ingredientId).join(', ')}
          />
        ) : null}
        {remaining.length > 0 ? (
          <SummaryGroup
            label={copy.results.summaryLeftoverLabel}
            count={remaining.length}
            items={remaining.map(leftoverText).join(', ')}
            divided={usedUp.length > 0}
          />
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
      </div>
    </section>
  );
}

type SummaryGroupProps = {
  label: string;
  count: number;
  /** 재료 이름(남는 재료는 양까지)을 쉼표로 이은 글 */
  items: string;
  /** 앞 덩어리와 장식 구분선으로 나눈다 */
  divided?: boolean;
};

/** 라벨 태그와 개수를 한 줄에 두고 세로 가운데로 맞춘다. 크기가 다른 글자의 기준선을 맞추면 어긋나 보이기 때문이다 */
function SummaryGroup({ label, count, items, divided = false }: SummaryGroupProps) {
  return (
    <div className={cn('flex flex-col gap-1', divided && 'border-t-(length:--border-width-divider) pt-3')}>
      <p className="flex items-center gap-2">
        <LabelTag>{label}</LabelTag>
        {/* flex 안의 공백은 화면에 보이지 않고, 화면 읽기 프로그램이 "다 써요 1개"로 띄어 읽게 한다 */}{' '}
        <span className="text-2xl font-bold">{copy.results.summaryCount(count)}</span>
      </p>
      <p className="break-keep">{items}</p>
    </div>
  );
}
