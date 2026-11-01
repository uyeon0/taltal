import type { Ingredient, InputUnit } from './types';

/**
 * 단위 하나가 몇 g인지. g은 늘 1이다. 그 재료에 환산 근거가 없는 단위면 0이다.
 * 입력을 g으로 바꿀 때와 g을 표시할 때 같은 기준을 쓰려고 한 곳에 둔다.
 */
export function gramsPerUnit(ingredient: Ingredient, unit: InputUnit): number {
  return unit === 'g' ? 1 : (ingredient.unitGrams[unit] ?? 0);
}

/** 사용자가 고른 단위와 수량을 g으로 바꾼다. 환산 근거가 없는 단위는 0g이다 */
export function toGrams(ingredient: Ingredient, qty: number, unit: InputUnit): number {
  return qty * gramsPerUnit(ingredient, unit);
}
