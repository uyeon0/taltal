'use client';

import { useState } from 'react';
import { ChevronDown, ShoppingBasket } from 'lucide-react';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';
import type { RecipeDetailView } from '../model/recipe-detail-view';

// 절은 위에 시트 폭 전체의 Ink 기본 선(3px)을 둬서 나눈다. 시트 안쪽 여백만큼 바깥으로 넓힌다
const SECTION_CLASS = '-mx-(--sheet-padding) flex flex-col gap-4 border-t border-foreground px-(--sheet-padding) pt-6';

type RecipeDetailContentProps = {
  view: RecipeDetailView;
  /** 상세를 받는 중이거나 받지 못했을 때 요약 자리에 보여 줄 안내 */
  pending?: React.ReactNode;
};

/**
 * 레시피 상세의 본문. RecipeDetailView만 받아 그리고 데이터 요청이나 시트 상태에 기대지 않는다.
 * 순서, 요리 이름, 조리 시간은 시트 머리에 있으므로 여기서는 요약, 재료, 만드는 법만 그린다.
 */
export function RecipeDetailContent({ view, pending }: RecipeDetailContentProps) {
  return (
    <div className="flex flex-col gap-6">
      {view.summary !== null ? <p className="break-keep">{view.summary}</p> : pending}

      <section className={SECTION_CLASS}>
        <h3 className="text-xl font-semibold">{copy.recipeSheet.ingredientsTitle}</h3>
        {view.owned.length > 0 ? <OwnedGroup view={view} /> : null}
        {view.toBuy.length > 0 || view.optional.length > 0 ? <ToBuyGroup view={view} /> : null}
        {view.seasonings.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold">
              {copy.recipeSheet.seasoningsTitle}{' '}
              <span className="text-xs font-medium">· {copy.recipeSheet.seasoningsBasis(view.servingsOriginal)}</span>
            </h4>
            <AmountList items={view.seasonings} />
          </div>
        ) : null}
      </section>

      {view.steps !== null ? (
        <section className={SECTION_CLASS}>
          <h3 className="text-xl font-semibold">{copy.recipeSheet.stepsTitle}</h3>
          <ol className="flex flex-col gap-4">
            {view.steps.map((step) => (
              <li key={step.no} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-foreground text-xs font-semibold"
                >
                  {step.no}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="break-keep">
                    <span className="sr-only">{step.no}. </span>
                    {step.text}
                  </p>
                  {step.tip ? (
                    <p className="text-xs break-keep">
                      <span className="font-semibold">{copy.recipeSheet.tip}</span> {step.tip}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

/** 재료 이름과 분량. 분량은 500으로 두어 무리 소제목(600)보다 낮춘다 */
function AmountList({ items }: { items: { name: string; amount: string }[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.name} className="flex items-start gap-3">
          <span className="min-w-0 flex-1 break-keep">{item.name}</span>
          <span className="font-medium">{item.amount}</span>
        </li>
      ))}
    </ul>
  );
}

/** 가진 재료와 접어 둔 원문 분량 */
function OwnedGroup({ view }: { view: RecipeDetailView }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-semibold">{copy.recipeSheet.ownedTitle}</h4>
      <AmountList items={view.owned} />
      <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
        <CollapsibleTrigger className="flex min-h-(--control-height) w-full items-center gap-2 text-left text-xs font-semibold hover:text-action-hover">
          <span className="flex-1">{copy.recipeSheet.originalAmounts}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-5 shrink-0 transition-transform', open && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-2">
          <AmountList items={view.owned.map((item) => ({ name: item.name, amount: item.originalAmount }))} />
          <p className="text-xs">{copy.recipeSheet.originalServings(view.servingsOriginal)}</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/** 사야 하는 재료는 다른 재료와 구분되게 테두리 상자에 넣는다. 고명은 양 없이 아래에 둔다 */
function ToBuyGroup({ view }: { view: RecipeDetailView }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-foreground bg-card p-(--card-padding)">
      <h4 className="flex items-center gap-2 font-semibold">
        <ShoppingBasket aria-hidden="true" className="size-6 shrink-0" />
        {copy.recipeSheet.toBuyTitle}
      </h4>
      <AmountList items={view.toBuy} />
      {view.optional.length > 0 ? (
        <AmountList items={view.optional.map((name) => ({ name, amount: copy.recipeSheet.optional }))} />
      ) : null}
    </div>
  );
}
