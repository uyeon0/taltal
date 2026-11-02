'use client';

import { useEffect, useState } from 'react';
import { fetchRecipeDetail, type RecipeDetail } from '@/entities/recipe';

export type RecipeDetailState = { status: 'loading' } | { status: 'ready'; detail: RecipeDetail } | { status: 'error' };

/**
 * 시트가 열려 있는 동안 레시피 하나의 상세를 받는다. 열 때마다 새로 받고, 받은 상세는 저장하지 않는다.
 * 닫거나 다른 레시피로 바뀌면 이전 요청을 끊어 늦게 온 응답이 지금 레시피를 덮지 않게 한다.
 */
export function useRecipeDetail(recipeId: number | null, open: boolean): RecipeDetailState {
  const [state, setState] = useState<RecipeDetailState>({ status: 'loading' });
  // 열거나 레시피가 바뀌면 그리는 중에 로딩으로 되돌린다. 이펙트에서 되돌리면 이전 내용이 한 번 보인다
  const [request, setRequest] = useState({ recipeId, open });
  if (request.recipeId !== recipeId || request.open !== open) {
    setRequest({ recipeId, open });
    if (open) setState({ status: 'loading' });
  }

  useEffect(() => {
    if (!open || recipeId === null) return;
    const controller = new AbortController();
    fetchRecipeDetail(recipeId, controller.signal).then(
      (detail) => {
        if (!controller.signal.aborted) setState({ status: 'ready', detail });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      }
    );
    return () => controller.abort();
  }, [recipeId, open]);

  return state;
}
