import { create } from 'zustand';
import type { InputUnit } from '@/entities/ingredient';
import { INITIAL_INVENTORY, type InventoryState } from './inventory';

type InventoryActions = {
  addItems: (items: { ingredientId: string; unit: InputUnit }[]) => void;
  setAmount: (ingredientId: string, amount: number, unit: InputUnit) => void;
  removeItem: (ingredientId: string) => void;
  setServings: (servings: number) => void;
  reset: () => void;
};

/**
 * 입력한 재료, 수량, 단위, 인분을 브라우저 메모리에 둔다. 새로고침하면 처음 상태로 돌아간다.
 * 서버는 처음 상태를 그리기만 하고 상태를 바꾸지 않으므로 요청 사이에 값이 섞이지 않는다.
 */
export const useInventory = create<InventoryState & InventoryActions>()((set) => ({
  ...INITIAL_INVENTORY,

  addItems: (items) =>
    set((state) => {
      // 이미 담은 재료는 다시 담지 않는다
      const added = new Set(state.items.map((item) => item.ingredientId));
      const newItems = items
        .filter((item) => !added.has(item.ingredientId))
        .map((item) => ({ ingredientId: item.ingredientId, amount: null, unit: item.unit }));
      return newItems.length === 0 ? state : { items: [...state.items, ...newItems] };
    }),

  setAmount: (ingredientId, amount, unit) =>
    set((state) => ({
      items: state.items.map((item) => (item.ingredientId === ingredientId ? { ...item, amount, unit } : item))
    })),

  removeItem: (ingredientId) =>
    set((state) => ({ items: state.items.filter((item) => item.ingredientId !== ingredientId) })),

  setServings: (servings) => set({ servings }),

  reset: () => set(INITIAL_INVENTORY)
}));
