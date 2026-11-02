// 사용량 시트의 재료별 배분. 가진 양을 요리마다 얼마나 쓰고 얼마나 남는지 나눈다.

import { splitLeftovers } from './leftovers';
import type { Result } from './types';

export type StockAllocation = {
  ingredientId: string;
  startGrams: number;
  leftGrams: number;
  /** 그 재료를 쓰는 요리의 가진 양 사용분. day 순서다. 산 양은 넣지 않는다 */
  parts: { day: number; recipeId: number; name: string; grams: number }[];
};

/**
 * 가진 재료마다 요리별 사용분을 구한다. 순서는 splitLeftovers와 같다(남는 비율이 큰 재료부터, 다 쓴 재료는 뒤).
 * 고명이 가진 양보다 많아 산 양이 있으면, 고명이 아닌 분량으로 쓰는 요리를 먼저 채우고
 * 남은 가진 양을 고명으로 쓰는 요리에 day 순서로 나눈다. 그래서 parts 합과 leftGrams를 더하면 startGrams다.
 */
export function allocateStock(result: Result): StockAllocation[] {
  const meals = [...result.meals].sort((a, b) => a.day - b.day);
  const { usedUp, remaining } = splitLeftovers(result.leftovers);

  return [...remaining, ...usedUp].map(({ ingredientId, startGrams, leftGrams }) => {
    const using = meals.flatMap((meal) => {
      const use = meal.uses.find((u) => u.ingredientId === ingredientId);
      return use ? [{ meal, grams: use.grams, bought: meal.toBuy.includes(ingredientId) }] : [];
    });
    const firm = using.filter((u) => !u.bought);
    let owned = Math.max(0, startGrams - leftGrams - firm.reduce((sum, u) => sum + u.grams, 0));

    const parts = using.flatMap(({ meal, grams, bought }) => {
      let ownedGrams = grams;
      if (bought) {
        ownedGrams = Math.min(grams, owned);
        owned -= ownedGrams;
      }
      return ownedGrams > 0 ? [{ day: meal.day, recipeId: meal.recipeId, name: meal.name, grams: ownedGrams }] : [];
    });
    return { ingredientId, startGrams, leftGrams, parts };
  });
}
