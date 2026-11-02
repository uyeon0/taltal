'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { USED_UP_GRAMS, allocateStock, type Result, type StockAllocation } from '@/features/find-meals';
import { amountsReconcile, formatAmount, type Ingredient, type InputUnit } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { AllocationSwatch, allocationBackground } from '@/shared/ui/allocation-swatch';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';

/** 사용량 시트 이름(?sheet=usage) */
export const USAGE_SHEET = 'usage';

type UsageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 지금 보는 묶음과 탭의 결과 */
  result: Result | null;
  /** 재료 id → 재료. 이름과 양 표시에 쓴다 */
  ingredients: ReadonlyMap<string, Ingredient>;
  /** 재료 id → 사용자가 고른 단위 */
  units: Readonly<Record<string, InputUnit>>;
};

/**
 * 재료별 사용량. 재료마다 처음 양을 100%로 한 누적 막대와 요리별 펼침 내역을 보여 준다.
 * 막대 비율은 g으로 구하고, 양은 사용자가 고른 단위로 쓴다. 사는 재료와 양념은 넣지 않는다.
 */
export function UsageSheet({ open, onOpenChange, result, ingredients, units }: UsageSheetProps) {
  const allocations = result ? allocateStock(result) : [];

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={copy.usageSheet.title}
      description={copy.usageSheet.description}
    >
      <ul className="flex flex-col gap-3">
        {allocations.map((allocation) => {
          const ingredient = ingredients.get(allocation.ingredientId);
          if (!ingredient) return null;
          const unit = units[allocation.ingredientId] ?? ingredient.inputUnits[0] ?? 'g';
          return (
            <li key={allocation.ingredientId}>
              <AllocationRow allocation={allocation} ingredient={ingredient} unit={unit} />
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}

type AllocationRowProps = {
  allocation: StockAllocation;
  ingredient: Ingredient;
  unit: InputUnit;
};

function AllocationRow({ allocation, ingredient, unit }: AllocationRowProps) {
  const [open, setOpen] = useState(false);
  const { ingredientId, startGrams, leftGrams, parts } = allocation;
  const usedUp = leftGrams < USED_UP_GRAMS;
  const amount = (grams: number) => formatAmount(ingredient, grams, unit);
  const reconciles = amountsReconcile(
    ingredient,
    unit,
    [...parts.map((part) => part.grams), ...(leftGrams > 0 ? [leftGrams] : [])],
    startGrams
  );
  const percent = (grams: number) => (startGrams > 0 ? `${(grams / startGrams) * 100}%` : '0%');

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      <CollapsibleTrigger className="flex min-h-(--control-height) w-full items-center gap-2 text-left hover:text-action-hover">
        <span className="min-w-0 flex-1 font-semibold break-keep">{ingredientId}</span>
        <span className="font-semibold">
          {usedUp ? copy.usageSheet.usedUp : copy.usageSheet.leftover(amount(leftGrams))}
        </span>
        <ChevronDown aria-hidden="true" className={cn('size-5 shrink-0 transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      {/* 같은 내용을 펼침 내역이 글자로 전하므로 막대는 화면 읽기에서 숨긴다 */}
      <div
        aria-hidden="true"
        className="flex h-6 overflow-hidden rounded-lg border border-foreground bg-allocation-remaining"
      >
        {parts.map((part) => (
          <span
            key={part.recipeId}
            // 남는 양이 없으면 마지막 조각의 선이 막대 바깥선과 겹치므로 뺀다
            className={cn(
              'h-full shrink-0 border-r border-foreground',
              usedUp && 'last:border-r-0',
              allocationBackground(part.day)
            )}
            style={{ width: percent(part.grams) }}
          />
        ))}
      </div>
      <CollapsibleContent>
        <ul className="flex flex-col gap-2 pt-1">
          {parts.map((part) => (
            <li key={part.recipeId} className="flex items-start gap-2">
              <AllocationSwatch order={part.day} className="mt-1" />
              <span className="min-w-0 flex-1 break-keep">
                {copy.mealCard.order(part.day)} · {part.name}
              </span>
              <span className="font-semibold">{amount(part.grams)}</span>
            </li>
          ))}
          {!usedUp ? (
            <li className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-1 inline-block size-4 shrink-0 rounded-full border border-foreground bg-allocation-remaining"
              />
              <span className="min-w-0 flex-1">{copy.usageSheet.leftover(amount(leftGrams))}</span>
            </li>
          ) : null}
        </ul>
        {!reconciles ? <p className="pt-2 text-sm text-muted-foreground">{copy.usageSheet.roundingNotice}</p> : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
