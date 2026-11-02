import { toGrams, type Ingredient, type Stock } from '@/entities/ingredient';
import type { InventoryItem, InventoryState } from './inventory';

/** 재료가 하나 이상이고 모두 양을 정했는지. 결과 화면은 false면 시작 홈으로 보낸다 */
export function isInventoryReady(state: Pick<InventoryState, 'items'>): boolean {
  return state.items.length > 0 && state.items.every((item) => item.amount !== null);
}

/**
 * 추천 함수와 /api/candidates에 넣는 가진 재료(g). 담은 순서를 유지한다.
 * 양을 정하지 않았거나, 재료 목록에 없거나, 환산 근거가 없어 0g인 재료는 뺀다.
 */
export function toStocks(items: InventoryItem[], ingredients: Ingredient[]): Stock[] {
  const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  return items.flatMap((item) => {
    const ingredient = byId.get(item.ingredientId);
    if (!ingredient || item.amount === null) return [];
    const grams = toGrams(ingredient, item.amount, item.unit);
    return grams > 0 ? [{ ingredientId: item.ingredientId, grams }] : [];
  });
}
