'use client';

// 공통 컴포넌트를 눈으로 확인하는 임시 화면. 시작 홈 작업에서 지운다(docs/specs/app-foundation.md "확인용 화면")

import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { IngredientImage } from '@/entities/ingredient';
import { copy } from '@/shared/copy';
import { withMinDuration } from '@/shared/lib/with-min-duration';
import { SHEET_OPENER_ATTR, useSheetRoute } from '@/shared/lib/use-sheet-route';
import { AppHeader } from '@/shared/ui/app-header';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { LoadingStatus } from '@/shared/ui/loading-status';
import { Mascot } from '@/shared/ui/mascot';
import { StatusMessage } from '@/shared/ui/status-message';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

const PREVIEW_INGREDIENTS = ['양파', '두부', '계란', '대파', '쇠고기', '없는재료'];
// 이미 담은 재료의 모습을 보려고 하나를 담긴 것으로 둔다
const PREVIEW_ADDED = '계란';

export function FoundationPreview() {
  const sheet = useSheetRoute('preview');
  const [loading, setLoading] = useState(false);
  const [servings, setServings] = useState('1');
  const [picked, setPicked] = useState<Set<string>>(() => new Set(['양파']));

  const togglePicked = (id: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const fakeRequest = async () => {
    setLoading(true);
    await withMinDuration(Promise.resolve());
    setLoading(false);
  };

  return (
    <main className="flex flex-col gap-(--section-gap) pb-12">
      <AppHeader backHref="/" />

      <section className="surface-brand flex items-center gap-3 px-(--page-gutter) py-6">
        <h1 className="flex-1 font-display text-display">{copy.intro.title}</h1>
        <Mascot pose="default" size={120} priority />
      </section>

      <section className="flex flex-col gap-3 px-(--page-gutter)">
        <Button size="primary" loading={loading} onClick={fakeRequest}>
          {copy.ingredients.findMeals}
        </Button>
        <Button variant="secondary">{copy.recovery.errorEdit}</Button>
        <Button variant="ghost">
          <Plus />
          {copy.ingredients.addIngredient}
        </Button>
        <Button disabled>{copy.ingredients.findMeals}</Button>
      </section>

      <section className="surface-brand flex flex-col gap-3 px-(--page-gutter) py-6">
        <Button size="primary">{copy.home.pickDirectly}</Button>
        <Button variant="ghost">
          <Plus />
          {copy.ingredients.addIngredient}
        </Button>
      </section>

      <section className="flex flex-col gap-3 px-(--page-gutter)">
        <StatusMessage tone="error" title={copy.recovery.errorTitle} description={copy.recovery.errorDescription} />
        <StatusMessage tone="warning" title={copy.results.estimateNotice} />
        <StatusMessage tone="success" title={copy.results.titleAllUsed} />
        <StatusMessage tone="info" title={copy.ingredients.receiptComingSoonGuide} />
      </section>

      <section className="flex flex-col gap-3 px-(--page-gutter)">
        <p className="font-semibold">{copy.ingredients.servings}</p>
        <ToggleGroup type="single" value={servings} onValueChange={(value) => value && setServings(value)}>
          {['1', '2', '3', '4'].map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      {/* 재료 카드의 평소, 선택됨, 담김 모습을 보는 임시 칸. 진짜 카드는 재료 입력 작업에서 만든다 */}
      <section className="grid grid-cols-3 gap-2 px-(--page-gutter)">
        {PREVIEW_INGREDIENTS.map((id) => {
          const added = id === PREVIEW_ADDED;
          const selected = picked.has(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={added ? undefined : selected}
              disabled={added}
              onClick={() => togglePicked(id)}
              className="relative flex flex-col items-center gap-1 rounded-lg border border-foreground bg-card p-2 text-foreground transition-colors disabled:cursor-not-allowed disabled:border-(--disabled-border) disabled:text-(--disabled-foreground)"
            >
              {selected ? (
                <span className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-(--selected-solid-background) text-(--selected-solid-foreground)">
                  <Check aria-hidden="true" className="size-4" />
                </span>
              ) : null}
              <IngredientImage ingredientId={id} size={64} />
              <span className="text-xs">{added ? `${id} · ${copy.ingredientSheet.alreadyAdded}` : id}</span>
            </button>
          );
        })}
      </section>

      <section className="px-(--page-gutter)">
        <LoadingStatus phrases={copy.loading.phrases} announcement={copy.loading.announcement} />
      </section>

      <section className="px-(--page-gutter)">
        <Button
          variant="secondary"
          className="w-full"
          onClick={(event) => sheet.openSheet(event.currentTarget)}
          {...{ [SHEET_OPENER_ATTR]: 'preview' }}
        >
          {copy.ingredientSheet.title}
        </Button>
      </section>

      {/* 본문 스크롤 위치 복귀를 보려고 길이를 늘린다 */}
      <div aria-hidden="true" className="h-96" />

      <BottomSheet
        open={sheet.open}
        onOpenChange={sheet.onOpenChange}
        title={copy.ingredientSheet.title}
        footer={
          <Button size="primary" className="w-full" onClick={sheet.closeSheet}>
            {copy.ingredientSheet.add(2)}
          </Button>
        }
      >
        <div className="flex flex-col gap-2 pt-2">
          <Label htmlFor="preview-search">{copy.ingredientSheet.searchPlaceholder}</Label>
          <Input id="preview-search" placeholder={copy.ingredientSheet.searchPlaceholder} />
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i}>
              {copy.recipeSheet.stepsTitle} {i + 1}
            </p>
          ))}
        </div>
      </BottomSheet>
    </main>
  );
}
