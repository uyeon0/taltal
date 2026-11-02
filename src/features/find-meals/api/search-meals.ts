import type { Ingredient, Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

import { findMealOptions, type Comparison, type Mode } from '../model/compare';
import type { FindMealOptionsRequest, FindMealOptionsResponse } from '../model/worker-messages';
import { fetchCandidates } from './fetch-candidates';

export type MealSearch = { candidates: Recipe[]; options: Record<Mode, Comparison> };

function abortError(): DOMException {
  return new DOMException('요리 찾기를 멈췄어요', 'AbortError');
}

/** Worker에서 두 묶음을 계산한다. Worker가 없는 환경(테스트)에서는 바로 계산한다 */
function computeOptions(request: FindMealOptionsRequest, signal?: AbortSignal): Promise<Record<Mode, Comparison>> {
  if (typeof Worker === 'undefined') {
    const { inventory, servings, candidates, ingredients } = request;
    return Promise.resolve(findMealOptions(inventory, servings, { candidates, ingredients }));
  }

  return new Promise((resolve, reject) => {
    // 계산마다 새로 만들고 끝나면 닫는다. 멈출 때 계산 중인 Worker를 바로 끝낼 수 있다
    const worker = new Worker(new URL('../model/find-meal-options.worker.ts', import.meta.url), { type: 'module' });
    const finish = () => {
      worker.terminate();
      signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      finish();
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    worker.onmessage = (event: MessageEvent<FindMealOptionsResponse>) => {
      finish();
      if (event.data.ok) resolve(event.data.options);
      else reject(new Error(event.data.message));
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || '요리 계산 실패'));
    };
    worker.postMessage(request);
  });
}

/**
 * 가진 재료에 맞는 후보를 서버에서 받고, 사지 않는 묶음과 조금 사는 묶음을 3·4·5가지씩 계산한다.
 * signal이 끊기면 요청과 계산을 멈추고 AbortError로 거절한다.
 */
export async function searchMeals(
  inventory: Stock[],
  servings: number,
  ingredients: Ingredient[],
  signal?: AbortSignal
): Promise<MealSearch> {
  const candidates = await fetchCandidates(inventory, servings, signal);
  if (signal?.aborted) throw abortError();
  const options = await computeOptions({ inventory, servings, candidates, ingredients }, signal);
  if (signal?.aborted) throw abortError();
  return { candidates, options };
}
