'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { INGREDIENT_ROW_ATTR, IngredientList } from '@/widgets/ingredient-list';
import {
  AMOUNT_EDITOR_ATTR,
  AMOUNT_TITLE_ATTR,
  INGREDIENT_PICKER_SHEET,
  IngredientPickerSheet,
  ServingsPicker,
  useInventory,
  type InventoryItem
} from '@/features/build-inventory';
import type { Ingredient } from '@/entities/ingredient';
import { SHEET_PARAM } from '@/shared/config';
import { copy } from '@/shared/copy';
import { SHEET_OPENER_ATTR, useSheetRoute } from '@/shared/lib/use-sheet-route';
import { AppHeader } from '@/shared/ui/app-header';
import { Button } from '@/shared/ui/button';
import { PantryBasics } from './pantry-basics';

type IngredientInputScreenProps = {
  pickable: Ingredient[];
  pantryBasics: string[];
  seasonings: Ingredient[];
};

/** 다음 그림 뒤에 포커스를 옮길 곳 */
type FocusTarget = { kind: 'title' | 'row'; ingredientId: string } | { kind: 'add' };

const firstIncomplete = (items: InventoryItem[]) => items.find((item) => item.amount === null)?.ingredientId ?? null;

export function IngredientInputScreen({ pickable, pantryBasics, seasonings }: IngredientInputScreenProps) {
  const router = useRouter();
  const items = useInventory((state) => state.items);
  const sheet = useSheetRoute(INGREDIENT_PICKER_SHEET);
  const ingredients = useMemo(() => new Map(pickable.map((ingredient) => [ingredient.id, ingredient])), [pickable]);

  // 펼친 재료는 화면에만 둔다. 결과에서 돌아오면 모두 접혀 있다
  const [openId, setOpenId] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [typing, setTyping] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const reasonId = useId();

  // 시작 홈의 "직접 고르기"는 시트를 연 주소로 온다. 그대로 두면 뒤로가기가 시트를 닫지 않고 시작 홈으로 가므로,
  // 쿼리를 지우고 이 화면에서 시트를 다시 열어 기록을 한 칸 만든다
  const enteredRef = useRef(false);
  const { openSheet } = sheet;
  useEffect(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    const url = new URL(window.location.href);
    if (url.searchParams.get(SHEET_PARAM) !== INGREDIENT_PICKER_SHEET) return;
    url.searchParams.delete(SHEET_PARAM);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    openSheet(addButtonRef.current);
  }, [openSheet]);

  // 시트가 닫힌 뒤 useSheetRoute가 여는 버튼으로 포커스를 돌려준 다음에 옮긴다.
  // 이 효과가 훅의 효과보다 뒤에 등록돼 같은 프레임에서 나중에 실행된다
  useEffect(() => {
    if (!focusTarget || sheet.open) return;
    const frame = requestAnimationFrame(() => {
      let target: HTMLElement | null = null;
      let scrollTarget: HTMLElement | null = null;
      if (focusTarget.kind === 'add') {
        target = addButtonRef.current;
        scrollTarget = target;
      } else {
        const attr = focusTarget.kind === 'title' ? AMOUNT_TITLE_ATTR : INGREDIENT_ROW_ATTR;
        target = document.querySelector<HTMLElement>(`[${attr}="${CSS.escape(focusTarget.ingredientId)}"]`);
        scrollTarget =
          focusTarget.kind === 'title' ? (target?.closest<HTMLElement>(`[${AMOUNT_EDITOR_ATTR}]`) ?? target) : target;
      }
      target?.focus({ preventScroll: true });
      scrollTarget?.scrollIntoView({ block: 'nearest' });
      setFocusTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusTarget, sheet.open]);

  // 아래 고정 영역의 높이만큼 본문 아래를 비워 마지막 구역과 펼친 편집이 가려지지 않게 한다.
  // 입력 중에 숨기면 높이가 0이 되므로 그때는 이전 값을 유지한다
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new ResizeObserver(() => {
      if (footer.offsetHeight > 0) setFooterHeight(footer.offsetHeight);
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const openNextIncomplete = (doneId: string | null) => {
    const next = firstIncomplete(useInventory.getState().items);
    setOpenId(next);
    if (next) setFocusTarget({ kind: 'title', ingredientId: next });
    else if (doneId) setFocusTarget({ kind: 'row', ingredientId: doneId });
    else setFocusTarget({ kind: 'add' });
  };

  const onTypingChange = useCallback((value: boolean) => setTyping(value), []);

  const incompleteCount = items.filter((item) => item.amount === null).length;
  const onPrimary = () => {
    if (incompleteCount > 0) {
      openNextIncomplete(null);
      return;
    }
    router.push('/results');
  };

  return (
    <div
      className="flex min-h-dvh flex-col pb-(--fixed-footer-height)"
      style={{ '--fixed-footer-height': `${footerHeight}px` } as React.CSSProperties}
    >
      <AppHeader backHref="/" />

      <main className="flex flex-col gap-6 px-(--page-gutter) pt-2 pb-6">
        <h1 className="font-display text-display">{copy.ingredients.title}</h1>

        <IngredientList
          ingredients={ingredients}
          openId={openId}
          onToggle={(id) => setOpenId((current) => (current === id ? null : id))}
          onAmountSet={openNextIncomplete}
          onRemove={() => openNextIncomplete(null)}
          onTypingChange={onTypingChange}
        />

        <div className="flex flex-col gap-3">
          <Button
            ref={addButtonRef}
            variant="ghost"
            className="self-start"
            onClick={(event) => sheet.openSheet(event.currentTarget)}
            {...{ [SHEET_OPENER_ATTR]: INGREDIENT_PICKER_SHEET }}
          >
            <Plus aria-hidden="true" />
            {copy.ingredients.addIngredient}
          </Button>
        </div>

        <PantryBasics names={pantryBasics} />

        <ServingsPicker />
      </main>

      <div
        ref={footerRef}
        // 직접 입력 중에는 가상 키보드 위로 올라온 고정 영역이 입력칸과 저장 버튼을 가리지 않게 숨긴다
        hidden={typing}
        className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-(--app-max-width) flex-col gap-2 border-t border-foreground bg-background px-(--page-gutter) py-3"
      >
        {items.length === 0 ? (
          <p id={reasonId} className="text-sm">
            {copy.ingredients.findMealsDisabledReason}
          </p>
        ) : null}
        <Button
          size="primary"
          className="w-full"
          disabled={items.length === 0}
          aria-describedby={items.length === 0 ? reasonId : undefined}
          onClick={onPrimary}
        >
          {incompleteCount > 0 ? copy.ingredients.setRemainingAmounts(incompleteCount) : copy.ingredients.findMeals}
        </Button>
      </div>

      <IngredientPickerSheet
        open={sheet.open}
        onOpenChange={sheet.onOpenChange}
        ingredients={pickable}
        seasonings={seasonings}
        onAdded={(ids) => {
          sheet.closeSheet();
          if (ids.length === 0) return;
          setOpenId(ids[0]);
          setFocusTarget({ kind: 'title', ingredientId: ids[0] });
        }}
      />
    </div>
  );
}
