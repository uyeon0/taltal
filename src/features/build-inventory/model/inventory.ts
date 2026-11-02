import type { InputUnit } from '@/entities/ingredient';

/** 담은 재료 하나. 화면을 오가도 유지하고, 새로고침하면 사라진다 */
export type InventoryItem = {
  ingredientId: string;
  amount: number | null; // 양을 정하지 않았으면 null. 기본값을 넣지 않는다
  unit: InputUnit; // 사용자가 고른 단위. 결과 화면까지 유지한다
};

export type InventoryState = {
  items: InventoryItem[];
  servings: number;
};

// 인분 기본값은 재료 입력 화면 작업에서 정한다
export const INITIAL_INVENTORY: InventoryState = { items: [], servings: 1 };
