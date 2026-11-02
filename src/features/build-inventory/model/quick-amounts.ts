import { gramsPerUnit, type Ingredient, type InputUnit } from '@/entities/ingredient';

/**
 * 빠른 수량 버튼 세 개의 값. 재료 데이터에 버튼 값이 없어서 기본 단위(inputUnits[0])의 무게로 정한다.
 * 규칙은 docs/requirements/ingredient-input.md "빠른 수량 버튼"이다.
 */
export function quickAmounts(ingredient: Ingredient): { unit: InputUnit; amounts: number[] } {
  const unit = ingredient.inputUnits[0] ?? 'g';
  if (unit === 'g') return { unit, amounts: [100, 200, 300] };
  if (gramsPerUnit(ingredient, unit) < 100) return { unit, amounts: [2, 5, 10] };
  return { unit, amounts: [0.5, 1, 2] };
}
