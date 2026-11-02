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

/** 고를 수 있는 인분. 요리 하나의 인분이다 */
export const SERVINGS_OPTIONS = [1, 2, 3, 4] as const;

export const INITIAL_INVENTORY: InventoryState = { items: [], servings: 2 };
