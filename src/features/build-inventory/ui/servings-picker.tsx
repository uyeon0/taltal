'use client';

import { useId } from 'react';
import { copy } from '@/shared/copy';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { SERVINGS_OPTIONS } from '../model/inventory';
import { useInventory } from '../model/inventory-store';

/** 요리 하나의 인분을 고른다. 결과에서 돌아와도 고른 값을 유지한다 */
export function ServingsPicker() {
  const servings = useInventory((state) => state.servings);
  const setServings = useInventory((state) => state.setServings);
  const labelId = useId();

  return (
    <section aria-labelledby={labelId} className="flex flex-col gap-3">
      <h2 id={labelId} className="text-xl font-bold">
        {copy.ingredients.servings}
      </h2>
      <ToggleGroup
        type="single"
        aria-labelledby={labelId}
        value={String(servings)}
        // 이미 고른 항목을 다시 누르면 Radix가 빈 값을 넘긴다. 인분은 비울 수 없으므로 무시한다
        onValueChange={(value) => {
          if (value) setServings(Number(value));
        }}
        className="grid grid-cols-4 max-compact:grid-cols-2"
      >
        {SERVINGS_OPTIONS.map((option) => (
          <ToggleGroupItem key={option} value={String(option)} className="px-2">
            {copy.ingredients.servingsOption(option)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  );
}
