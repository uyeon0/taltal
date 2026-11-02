'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchMeals, type MealSearch } from '@/features/find-meals';
import type { Ingredient, Stock } from '@/entities/ingredient';
import { withMinDuration } from '@/shared/lib/with-min-duration';

export type SearchState =
  | { status: 'loading' }
  | { status: 'error' }
  /** id는 계산마다 다르다. 결과 화면의 묶음과 탭 상태를 새 결과로 되돌릴 때 쓴다 */
  | { status: 'done'; id: number; search: MealSearch };

/**
 * 요리 찾기를 한 번 하고, retry로 같은 입력으로 다시 한다.
 * 새 계산을 시작하거나 화면을 떠나면 이전 계산을 멈추고, 마지막 계산의 결과만 반영한다.
 */
export function useMealSearch(input: { inventory: Stock[]; servings: number } | null, ingredients: Ingredient[]) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SearchState>({ status: 'loading' });
  const lastIdRef = useRef(0);

  useEffect(() => {
    if (!input) return;
    const id = ++lastIdRef.current;
    const controller = new AbortController();
    withMinDuration(searchMeals(input.inventory, input.servings, ingredients, controller.signal)).then(
      (search) => {
        if (id === lastIdRef.current) setState({ status: 'done', id, search });
      },
      () => {
        if (id === lastIdRef.current && !controller.signal.aborted) setState({ status: 'error' });
      }
    );
    return () => controller.abort();
  }, [input, ingredients, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((current) => current + 1);
  }, []);

  return { state, retry };
}
