// 결과의 가진 재료를 다 쓴 것과 남는 것으로 나눈다. 요약과 사용량 시트가 같은 판정과 순서를 쓴다.

import type { Leftover } from './types';

/** 이보다 적게 남은 재료는 다 쓴 것으로 센다(docs/requirements/results.md "요약") */
export const USED_UP_GRAMS = 1;

const leftRatio = (leftover: Leftover) => (leftover.startGrams > 0 ? leftover.leftGrams / leftover.startGrams : 0);

/**
 * 다 쓴 재료는 leftovers 순서(담은 순서)를 유지한다.
 * 남는 재료는 처음 양 대비 남는 비율이 큰 순서다. 같으면 leftovers 순서다.
 */
export function splitLeftovers(leftovers: Leftover[]): { usedUp: Leftover[]; remaining: Leftover[] } {
  const usedUp = leftovers.filter((leftover) => leftover.leftGrams < USED_UP_GRAMS);
  const remaining = leftovers
    .filter((leftover) => leftover.leftGrams >= USED_UP_GRAMS)
    .map((leftover, index) => ({ leftover, index }))
    .sort((a, b) => leftRatio(b.leftover) - leftRatio(a.leftover) || a.index - b.index)
    .map(({ leftover }) => leftover);
  return { usedUp, remaining };
}
