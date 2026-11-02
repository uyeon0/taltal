'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Trash2 } from 'lucide-react';
import type { Ingredient, InputUnit } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { toggleVariants } from '@/shared/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { changeDraftUnit, createDraft, draftAmount, editDraftText } from '../model/amount-input';
import { formatQuantity } from '../model/format-quantity';
import type { InventoryItem } from '../model/inventory';
import { useInventory } from '../model/inventory-store';
import { quickAmounts } from '../model/quick-amounts';

/** 펼친 편집의 제목. 다음 재료를 펼칠 때 화면이 이 속성으로 포커스를 옮긴다 */
export const AMOUNT_TITLE_ATTR = 'data-amount-title';
/** 펼친 편집 전체. 화면 안으로 스크롤할 때 쓴다 */
export const AMOUNT_EDITOR_ATTR = 'data-amount-editor';

type AmountEditorProps = {
  ingredient: Ingredient;
  item: InventoryItem;
  /** 편집 영역의 id. 재료 줄 버튼의 aria-controls가 가리킨다 */
  id: string;
  /** 양을 정한 뒤. 화면이 다음 미완료 재료를 펼친다 */
  onAmountSet: (ingredientId: string) => void;
  /** 재료를 뺀 뒤 */
  onRemove: (ingredientId: string) => void;
  /** 직접 입력칸에 포커스가 있는지. 화면이 가상 키보드에 가리지 않게 아래 고정 영역을 숨긴다 */
  onTypingChange: (typing: boolean) => void;
};

/** 재료 하나의 양을 정한다. 빠른 수량 버튼을 누르거나 직접 입력한다 */
export function AmountEditor({ ingredient, item, id, onAmountSet, onRemove, onTypingChange }: AmountEditorProps) {
  const setAmount = useInventory((state) => state.setAmount);
  const removeItem = useInventory((state) => state.removeItem);
  const [customOpen, setCustomOpen] = useState(false);
  const titleId = `${id}-title`;
  const customId = `${id}-custom`;
  const quick = quickAmounts(ingredient);

  const save = (amount: number, unit: InputUnit) => {
    setAmount(ingredient.id, amount, unit);
    onAmountSet(ingredient.id);
  };

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={titleId}
      className="flex scroll-mb-(--fixed-footer-height) flex-col gap-3"
      {...{ [AMOUNT_EDITOR_ATTR]: ingredient.id }}
    >
      <h3 id={titleId} tabIndex={-1} className="text-base font-semibold" {...{ [AMOUNT_TITLE_ATTR]: ingredient.id }}>
        {/* 화면에는 바로 위 재료 줄에 이름이 있다. 포커스를 옮겼을 때 화면 읽기 프로그램이 어느 재료인지 읽도록 이름을 숨겨 둔다 */}
        <span className="sr-only">{ingredient.id} </span>
        {copy.ingredients.amountTitle}
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {quick.amounts.map((amount) => {
          const pressed = item.amount === amount && item.unit === quick.unit;
          return (
            <button
              key={amount}
              type="button"
              aria-pressed={pressed}
              className={cn(toggleVariants(), 'px-2')}
              onClick={() => save(amount, quick.unit)}
            >
              <Check aria-hidden="true" className="hidden group-aria-pressed/toggle:block" />
              {formatQuantity(amount, quick.unit)}
            </button>
          );
        })}
      </div>

      {/* 주 흐름을 돕는 보조 행동이라 Ghost로 둔다. 펼침 아이콘이 누를 수 있다는 것을 알린다 */}
      <Button
        variant="ghost"
        className="self-start"
        aria-expanded={customOpen}
        aria-controls={customId}
        onClick={() => setCustomOpen((open) => !open)}
      >
        {copy.ingredients.customAmount}
        <ChevronDown aria-hidden="true" className={cn('transition-transform', customOpen && 'rotate-180')} />
      </Button>

      {customOpen ? (
        <CustomAmount id={customId} ingredient={ingredient} item={item} onSave={save} onTypingChange={onTypingChange} />
      ) : null}

      <Button
        variant="ghost"
        className="self-start"
        onClick={() => {
          removeItem(ingredient.id);
          onRemove(ingredient.id);
        }}
      >
        <Trash2 aria-hidden="true" />
        {copy.ingredients.remove}
      </Button>
    </div>
  );
}

type CustomAmountProps = {
  id: string;
  ingredient: Ingredient;
  item: InventoryItem;
  onSave: (amount: number, unit: InputUnit) => void;
  onTypingChange: (typing: boolean) => void;
};

/** 직접 입력. 단위를 바꾸면 넣은 숫자도 같은 양으로 환산한다 */
function CustomAmount({ id, ingredient, item, onSave, onTypingChange }: CustomAmountProps) {
  const [draft, setDraft] = useState(() => createDraft(ingredient, item.amount, item.unit));
  const [showError, setShowError] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 펼치면 바로 숫자를 넣을 수 있게 입력칸으로 옮긴다
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 입력칸에 포커스가 있는 채로 접히면 blur가 오지 않으므로 여기서 알린다
  useEffect(() => () => onTypingChange(false), [onTypingChange]);

  // 가상 키보드가 열려 보이는 높이가 줄면 입력칸과 저장 버튼을 다시 보이게 한다
  const keepInView = () => formRef.current?.scrollIntoView({ block: 'nearest' });
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onResize = () => {
      if (document.activeElement === inputRef.current) keepInView();
    };
    viewport.addEventListener('resize', onResize);
    return () => viewport.removeEventListener('resize', onResize);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = draftAmount(draft, ingredient);
    if (amount === null) {
      setShowError(true);
      inputRef.current?.focus();
      return;
    }
    onSave(amount, draft.unit);
  };

  return (
    <form
      ref={formRef}
      id={id}
      noValidate
      onSubmit={submit}
      className="flex scroll-mb-(--fixed-footer-height) flex-col gap-3"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>{copy.ingredients.customAmount}</Label>
        <Input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft.text}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errorId : undefined}
          onChange={(event) => {
            setDraft(editDraftText(draft, ingredient, event.target.value));
            setShowError(false);
          }}
          onFocus={() => {
            onTypingChange(true);
            keepInView();
          }}
          onBlur={() => onTypingChange(false)}
        />
        {showError ? (
          <p id={errorId} role="alert" className="text-base text-error">
            {copy.ingredients.amountError}
          </p>
        ) : null}
      </div>

      <ToggleGroup
        type="single"
        aria-label={copy.ingredients.unit}
        value={draft.unit}
        onValueChange={(value) => {
          if (!value) return;
          setDraft(changeDraftUnit(draft, ingredient, value as InputUnit));
          setShowError(false);
        }}
      >
        {ingredient.inputUnits.map((unit) => (
          <ToggleGroupItem key={unit} value={unit}>
            {unit}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Button type="submit" size="primary" className="w-full">
        {copy.ingredients.customAmountSave}
      </Button>
    </form>
  );
}
