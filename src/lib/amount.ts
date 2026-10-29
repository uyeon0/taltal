// 화면에서 쓰는 양 환산과 표시. 규칙은 기록 저장소 ui-flow.md를 따른다.

import type { Ingredient } from "@/logic/types";

export const num = (n: number) => String(Math.round(n * 10) / 10);

export function toGrams(ingredient: Ingredient, qty: number, unit: string): number {
  return qty * (ingredient.unitGrams[unit] ?? 0);
}

/** 사용자가 고른 단위로 g을 다시 바꿔 보여 준다. 예: 100g, 단 → "0.1단" */
export function inUnit(ingredient: Ingredient, grams: number, unit: string): string {
  if (unit === "g") return `${num(grams)}g`;
  return `${num(grams / ingredient.unitGrams[unit])}${unit}`;
}

/** 장보기 양. 기본 단위 1개보다 적으면 "조금", 그 이상이면 기본 단위로 쓴다. */
export function shoppingAmount(ingredient: Ingredient, grams: number): string {
  const unit = ingredient.inputUnits[0];
  if (!unit || unit === "g") return `${num(grams)}g`;
  const per = ingredient.unitGrams[unit];
  if (grams < per) return `조금 (${num(grams)}g)`;
  return `약 ${num(grams / per)}${unit} (${num(grams)}g)`;
}

/** 칩이나 검색으로 처음 담을 때의 수량. 단위가 g뿐이면 200g으로 담는다. */
export function defaultQty(ingredient: Ingredient): { qty: number; unit: string } {
  const unit = ingredient.inputUnits[0] ?? "g";
  return unit === "g" ? { qty: 200, unit } : { qty: 1, unit };
}
