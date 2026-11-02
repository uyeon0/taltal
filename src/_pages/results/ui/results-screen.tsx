'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { preload } from 'react-dom';
import { isInventoryReady, toStocks, useInventory } from '@/features/build-inventory';
import type { Ingredient, InputUnit } from '@/entities/ingredient';
import { MASCOT_IMAGES } from '@/shared/assets';
import { copy } from '@/shared/copy';
import { canGoBackInApp } from '@/shared/lib/app-history';
import { AppHeader } from '@/shared/ui/app-header';
import { Button } from '@/shared/ui/button';
import { LoadingStatus } from '@/shared/ui/loading-status';
import { Mascot } from '@/shared/ui/mascot';
import { StatusMessage } from '@/shared/ui/status-message';
import { loadingPhrases } from '../model/loading-phrases';
import { useMealSearch } from '../model/use-meal-search';
import { ResultsView } from './results-view';

const INGREDIENTS_HREF = '/ingredients';

type ResultsScreenProps = {
  /** 양념까지 모든 재료 */
  ingredients: Ingredient[];
};

/**
 * cacheComponents가 켜져 있어 이 화면은 떠나도 지워지지 않고 숨겨진다(React Activity).
 * 숨겨질 때 계산하는 화면을 새로 그려 둔다. 그래서 다시 보일 때 이전 결과가 잠깐 보이지 않고 계산 중부터 시작한다.
 * 요리 찾기, 브라우저 뒤로가기·앞으로가기 어느 쪽으로 들어와도 그때의 입력으로 다시 계산한다.
 */
export function ResultsScreen({ ingredients }: ResultsScreenProps) {
  const [visit, setVisit] = useState(0);
  useLayoutEffect(() => () => setVisit((current) => current + 1), []);
  return <ResultsSearch key={visit} ingredients={ingredients} />;
}

/**
 * 입력을 확인하고 요리를 찾는다. 입력이 없으면(새로고침, 주소로 바로 들어옴) 시작 홈으로 보낸다.
 * 숨겨진 사이 입력이 바뀔 수 있어 저장소를 구독하고, 계산은 화면이 보일 때 시작한다. 이 화면은 저장소를 바꾸지 않는다.
 */
function ResultsSearch({ ingredients }: ResultsScreenProps) {
  // 오류 화면은 연결이 끊겼을 때 나오므로 그때 다람쥐를 받지 못한다. 미리 받아 둔다
  preload(MASCOT_IMAGES.retry, { as: 'image' });
  const router = useRouter();
  const items = useInventory((state) => state.items);
  const servings = useInventory((state) => state.servings);
  const ready = isInventoryReady({ items });
  const input = useMemo(
    () => (ready ? { inventory: toStocks(items, ingredients), servings } : null),
    [ready, items, servings, ingredients]
  );
  const units = useMemo(
    () => Object.fromEntries(items.map((item) => [item.ingredientId, item.unit])) as Record<string, InputUnit>,
    [items]
  );
  const phrases = useMemo(() => loadingPhrases(items.map((item) => item.ingredientId)), [items]);
  const { state, retry } = useMealSearch(input, ingredients);

  useEffect(() => {
    if (!ready) router.replace('/');
  }, [ready, router]);

  // 두 묶음 모두 탭이 없으면 추천 없음이다
  const empty =
    state.status === 'done' &&
    state.search.options.noBuy.options.length === 0 &&
    state.search.options.buy.options.length === 0;
  const needsRecovery = state.status === 'error' || empty;
  const recoveryRef = useRef<HTMLElement>(null);

  // 누른 "요리 찾기" 버튼이 사라지면 포커스가 body로 빠진다. 그럴 때만 첫 행동 버튼으로 옮긴다
  useEffect(() => {
    if (!needsRecovery) return;
    if (document.activeElement && document.activeElement !== document.body) return;
    recoveryRef.current?.querySelector<HTMLElement>('[data-slot="status-message"] button')?.focus();
  }, [needsRecovery]);

  if (!ready) return null;

  // 머리글의 뒤로가기와 같다. 재료 입력에서 왔으면 뒤로 가고, 아니면 재료 입력으로 간다
  const editIngredients = () => {
    if (canGoBackInApp()) router.back();
    else router.push(INGREDIENTS_HREF);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader backHref={INGREDIENTS_HREF} backLabel={copy.results.editIngredients} />
      {state.status === 'done' && !empty ? (
        <ResultsView key={state.id} search={state.search} ingredients={ingredients} units={units} servings={servings} />
      ) : (
        <main
          ref={recoveryRef}
          className="flex flex-1 flex-col items-center justify-center gap-6 px-(--page-gutter) pb-12"
        >
          {state.status === 'loading' ? (
            <>
              <Mascot pose="thinking" size={200} priority />
              <LoadingStatus phrases={phrases} announcement={copy.loading.announcement} />
            </>
          ) : (
            <>
              <Mascot pose="retry" size={200} />
              {empty ? (
                <StatusMessage
                  tone="info"
                  title={copy.recovery.emptyTitle}
                  description={copy.recovery.emptyDescription}
                  className="w-full"
                  actions={<Button onClick={editIngredients}>{copy.recovery.emptyAction}</Button>}
                />
              ) : (
                <StatusMessage
                  tone="error"
                  title={copy.recovery.errorTitle}
                  description={copy.recovery.errorDescription}
                  className="w-full"
                  actions={
                    <>
                      <Button onClick={retry}>{copy.recovery.errorRetry}</Button>
                      <Button variant="secondary" onClick={editIngredients}>
                        {copy.recovery.errorEdit}
                      </Button>
                    </>
                  }
                />
              )}
            </>
          )}
        </main>
      )}
    </div>
  );
}
