import type { Ingredient } from './types';

/** 사용자가 고른 단위와 수량을 g으로 바꾼다. 환산 근거가 없는 단위는 0g이다 */
export function toGrams(ingredient: Ingredient, qty: number, unit: string): number {
  return qty * (ingredient.unitGrams[unit] ?? 0);
}
