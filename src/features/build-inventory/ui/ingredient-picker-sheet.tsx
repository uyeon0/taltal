'use client';

import { useId, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { IngredientImage, type Ingredient } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useInventory } from '../model/inventory-store';
import { findSeasonings, matchesQuery } from '../model/search';

type IngredientPickerSheetProps = {
  /** 열고 닫는 상태. 화면이 useSheetRoute(INGREDIENT_PICKER_SHEET)로 갖는다 */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 고를 수 있는 재료. 보여 줄 순서대로 */
  ingredients: Ingredient[];
  /** 양념. 목록에는 없지만 검색하면 안내한다 */
  seasonings: Ingredient[];
  /** 담은 뒤. 넘긴 id는 고른 순서다. 화면이 시트를 닫고 첫 재료를 펼친다 */
  onAdded: (ingredientIds: string[]) => void;
};

/**
 * 재료를 여러 개 골라 한 번에 담는다. 고르기만 하거나 닫으면 담은 재료 목록은 바뀌지 않는다.
 * 검색으로 가려진 재료도 고른 상태를 유지한다.
 */
export function IngredientPickerSheet({
  open,
  onOpenChange,
  ingredients,
  seasonings,
  onAdded
}: IngredientPickerSheetProps) {
  const items = useInventory((state) => state.items);
  const addItems = useInventory((state) => state.addItems);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [wasOpen, setWasOpen] = useState(open);
  const searchRef = useRef<HTMLInputElement>(null);
  const reasonId = useId();

  // 열 때마다 고른 것과 검색어를 비운다. 렌더 중에 맞춰서 지난 선택이 한 번도 보이지 않게 한다
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setSelected([]);
    }
  }

  const added = new Set(items.map((item) => item.ingredientId));
  const shown = ingredients.filter((ingredient) => matchesQuery(ingredient, query));

  // 재료가 하나라도 맞으면 안내하지 않는다
  const found = shown.length === 0 ? findSeasonings(seasonings, query) : null;
  const seasoningMatch = found && (found.basic.length > 0 || found.special.length > 0) ? found : null;

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const add = () => {
    const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    const picked = selected.filter((id) => byId.has(id) && !added.has(id));
    addItems(picked.map((id) => ({ ingredientId: id, unit: byId.get(id)!.inputUnits[0] })));
    onAdded(picked);
  };

  const clearSearch = () => {
    setQuery('');
    searchRef.current?.focus();
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={copy.ingredientSheet.title}
      footer={
        <div className="flex flex-col gap-2">
          {selected.length === 0 ? (
            <p id={reasonId} className="text-sm">
              {copy.ingredientSheet.addDisabledReason}
            </p>
          ) : null}
          <Button
            size="primary"
            className="w-full"
            disabled={selected.length === 0}
            aria-describedby={selected.length === 0 ? reasonId : undefined}
            onClick={add}
          >
            {copy.ingredientSheet.add(selected.length)}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-2">
        <Input
          ref={searchRef}
          type="search"
          aria-label={copy.ingredientSheet.searchPlaceholder}
          placeholder={copy.ingredientSheet.searchPlaceholder}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {seasoningMatch ? (
          <div role="status" className="flex flex-col gap-2 py-4">
            {seasoningMatch.basic.length > 0 ? (
              <p>{copy.ingredientSheet.basicSeasoning(seasoningMatch.basic)}</p>
            ) : null}
            {seasoningMatch.special.length > 0 ? (
              <p>{copy.ingredientSheet.specialSeasoning(seasoningMatch.special)}</p>
            ) : null}
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-4">
            <p>{copy.ingredientSheet.noResult(query.trim())}</p>
            <Button variant="secondary" onClick={clearSearch}>
              <X aria-hidden="true" />
              {copy.ingredientSheet.clearSearch}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {shown.map((ingredient) => {
              const isAdded = added.has(ingredient.id);
              const isSelected = selected.includes(ingredient.id);
              return (
                <button
                  key={ingredient.id}
                  type="button"
                  aria-pressed={isAdded ? undefined : isSelected}
                  disabled={isAdded}
                  onClick={() => toggle(ingredient.id)}
                  // 여러 개 고르는 칸이라 카드가 아니라 8px 라운딩이다. 고른 칸은 체크로만 구분하고, 선과 면은 고르기 전과 같다(docs/design.md "컴포넌트 상태")
                  className="relative flex min-h-(--control-height) flex-col items-center gap-1 rounded-lg border border-foreground bg-card px-1 py-2 text-center text-base font-semibold text-foreground transition-colors disabled:cursor-not-allowed disabled:border-(--disabled-border) disabled:text-(--disabled-foreground)"
                >
                  <IngredientImage ingredientId={ingredient.id} size={64} />
                  <span className="break-keep">{ingredient.id}</span>
                  {isAdded ? <span className="text-xs">{copy.ingredientSheet.alreadyAdded}</span> : null}
                  {isSelected ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-foreground text-background"
                    >
                      <Check className="size-4" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
