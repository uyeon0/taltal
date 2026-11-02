'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { AmountEditor, formatQuantity, useInventory, type InventoryItem } from '@/features/build-inventory';
import { IngredientImage, type Ingredient } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { Mascot } from '@/shared/ui/mascot';

/** 재료 줄 버튼. 편집을 닫은 뒤 화면이 이 속성으로 포커스를 돌려준다 */
export const INGREDIENT_ROW_ATTR = 'data-ingredient-row';

type IngredientListProps = {
  /** 재료 id → 재료. 담은 재료의 이름, 단위, 그림에 쓴다 */
  ingredients: ReadonlyMap<string, Ingredient>;
  /** 수량 편집을 펼친 재료. 한 번에 하나만 펼친다 */
  openId: string | null;
  onToggle: (ingredientId: string) => void;
  onAmountSet: (ingredientId: string) => void;
  onRemove: (ingredientId: string) => void;
  onTypingChange: (typing: boolean) => void;
};

/** 담은 재료 목록과 수량 편집. 비어 있으면 빈 목록 안내를 보여 준다 */
export function IngredientList({ ingredients, openId, ...handlers }: IngredientListProps) {
  const items = useInventory((state) => state.items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Mascot pose="discovery" size={160} />
        <p className="text-xl font-bold">{copy.ingredients.emptyTitle}</p>
        <p>{copy.ingredients.emptyDescription}</p>
      </div>
    );
  }

  // 담은 재료는 한 묶음이라 카드 하나에 담고 줄 사이를 장식 구분선으로 나눈다(docs/design.md "공간과 형태")
  return (
    <ul className="surface-default flex flex-col rounded-xl border border-foreground bg-card">
      {items.map((item) => {
        const ingredient = ingredients.get(item.ingredientId);
        // 재료 데이터에서 빠진 재료는 이름, 단위를 알 수 없어 보여 주지 않는다
        if (!ingredient) return null;
        return (
          <IngredientRow
            key={item.ingredientId}
            ingredient={ingredient}
            item={item}
            open={openId === item.ingredientId}
            {...handlers}
          />
        );
      })}
    </ul>
  );
}

type IngredientRowProps = Omit<IngredientListProps, 'ingredients' | 'openId'> & {
  ingredient: Ingredient;
  item: InventoryItem;
  open: boolean;
};

function IngredientRow({
  ingredient,
  item,
  open,
  onToggle,
  onAmountSet,
  onRemove,
  onTypingChange
}: IngredientRowProps) {
  const editorId = useId();

  return (
    <li className="border-t-(length:--border-width-divider) first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? editorId : undefined}
        onClick={() => onToggle(ingredient.id)}
        className="flex min-h-(--control-height) w-full items-center gap-3 p-3 text-left hover:text-action-hover"
        {...{ [INGREDIENT_ROW_ATTR]: ingredient.id }}
      >
        <IngredientImage ingredientId={ingredient.id} size={48} />
        <span className="min-w-0 flex-1 text-base font-semibold break-keep">{ingredient.id}</span>
        {/* 양을 정하지 않은 재료도 판단에 필요한 정보라 Muted로 약하게 만들지 않는다 */}
        <span className="text-base font-semibold">
          {item.amount === null ? copy.ingredients.amountUnset : formatQuantity(item.amount, item.unit)}
        </span>
        <ChevronDown aria-hidden="true" className={cn('size-5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="px-3 pb-3">
          <AmountEditor
            id={editorId}
            ingredient={ingredient}
            item={item}
            onAmountSet={onAmountSet}
            onRemove={onRemove}
            onTypingChange={onTypingChange}
          />
        </div>
      ) : null}
    </li>
  );
}
