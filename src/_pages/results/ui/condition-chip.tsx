'use client';

import { Pencil } from 'lucide-react';
import { copy } from '@/shared/copy';
import { buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

type ConditionChipProps = {
  /** 재료 입력 목록 순서의 재료 이름 */
  names: string[];
  servings: number;
  onEdit: () => void;
};

/**
 * 결과를 낸 재료와 인분을 보여 주고, 누르면 재료 입력으로 간다(docs/specs/results-condition-chip.md).
 * 스크롤해도 화면 위에 붙고, 아래 선으로 스크롤되는 내용과 층을 나눈다(docs/design.md "공간과 형태")
 */
export function ConditionChip({ names, servings, onEdit }: ConditionChipProps) {
  const label = copy.results.condition(names, servings);
  return (
    <div className="sticky top-0 z-10 border-b border-foreground bg-background px-(--page-gutter) py-2">
      <button
        type="button"
        onClick={onEdit}
        aria-label={copy.results.conditionLabel(label)}
        className={cn(buttonVariants({ variant: 'secondary' }), 'w-full justify-between')}
      >
        <span className="min-w-0 truncate">{label}</span>
        <Pencil />
      </button>
    </div>
  );
}
