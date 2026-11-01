// 3·4·5가지를 모두 계산해 비교할 결과를 고른다. 사지 않는 묶음과 조금 사는 묶음을 함께 계산한다.

import type { Ingredient, Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

import { recommend } from './recommend';
import type { Result } from './types';

// 요리 가짓수는 사용자가 고르지 않고 3·4·5가지를 모두 계산해 비교해 보여 준다
export const DISH_COUNTS = [3, 4, 5];

export type Option = { dishes: number; result: Result };
export type Comparison = { options: Option[]; best: number };

// 결과는 두 가지로 나눠 보여 준다. 사지 않고 만들 수 있는 묶음과, 조금 사서 더 다 쓰는 묶음
export type Mode = 'noBuy' | 'buy';
const MAX_PURCHASES_BY_MODE: Record<Mode, number | undefined> = { noBuy: 0, buy: undefined };

/**
 * 가짓수별 결과 중 보여 줄 것을 고른다. 요리를 더 해도 남는 양 점수가 줄지 않는 결과는 숨긴다.
 * 구매 3가지 한도 때문에 가짓수를 늘리면 덜 쓰는 묶음이 나올 수 있어서다.
 * 탐색과 같은 점수(leftoverScore)로 비교한다. g 비율로 비교하면 빨리 상하는 채소를 다 쓰는 묶음이 숨겨질 수 있다.
 * 남은 결과는 가짓수가 늘수록 덜 남으므로 마지막 것이 가장 덜 남는다.
 */
export function compare(results: Option[]): Comparison {
  const options: Option[] = [];
  for (const o of results) {
    if (o.result.status === 'empty') continue;
    const prev = options.at(-1);
    // 5가지를 요청해도 4가지만 찾으면 4가지 결과와 같으므로 뺀다
    if (prev && (prev.dishes >= o.result.meals.length || prev.result.leftoverScore <= o.result.leftoverScore + 1e-6))
      continue;
    options.push({ dishes: o.result.meals.length, result: o.result });
  }
  return { options, best: options.length - 1 };
}

/** 같은 후보로 두 묶음을 3·4·5가지씩 계산해 비교 결과를 돌려준다 */
export function findMealOptions(
  inventory: Stock[],
  servings: number,
  data: { candidates: Recipe[]; ingredients: Ingredient[] }
): Record<Mode, Comparison> {
  const byMode = (mode: Mode) =>
    compare(
      DISH_COUNTS.map((dishes) => ({
        dishes,
        result: recommend(inventory, { meals: dishes, servings, maxPurchases: MAX_PURCHASES_BY_MODE[mode] }, data)
      }))
    );
  return { noBuy: byMode('noBuy'), buy: byMode('buy') };
}
