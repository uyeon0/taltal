// 입력 상태를 바꾸는 규칙을 확인한다.

import assert from 'node:assert/strict';
import { beforeEach, test } from 'vitest';

import { INITIAL_INVENTORY } from './inventory';
import { useInventory } from './inventory-store';

const store = () => useInventory.getState();

beforeEach(() => {
  store().reset();
  store().addItems([{ ingredientId: '양파', unit: '개' }]);
});

test('담은 재료는 양을 정하지 않은 상태로 들어간다', () => {
  assert.deepEqual(store().items, [{ ingredientId: '양파', amount: null, unit: '개' }]);
});

test('이미 담은 재료는 다시 담지 않는다', () => {
  store().addItems([
    { ingredientId: '양파', unit: 'g' },
    { ingredientId: '두부', unit: '모' }
  ]);
  assert.deepEqual(
    store().items.map((item) => [item.ingredientId, item.unit]),
    [
      ['양파', '개'],
      ['두부', '모']
    ]
  );
});

test('양을 정하면 고른 단위도 함께 바뀐다', () => {
  store().setAmount('양파', 300, 'g');
  assert.deepEqual(store().items[0], { ingredientId: '양파', amount: 300, unit: 'g' });
});

test('재료를 빼고, 인분을 바꾸고, 처음으로 되돌린다', () => {
  store().removeItem('양파');
  assert.deepEqual(store().items, []);

  store().setServings(2);
  assert.equal(store().servings, 2);

  store().reset();
  assert.deepEqual({ items: store().items, servings: store().servings }, INITIAL_INVENTORY);
});

test('한 번에 넘긴 목록 안의 중복도 하나만 담는다', () => {
  store().addItems([
    { ingredientId: '두부', unit: '모' },
    { ingredientId: '두부', unit: 'g' }
  ]);
  assert.deepEqual(
    store().items.map((item) => [item.ingredientId, item.unit]),
    [
      ['양파', '개'],
      ['두부', '모']
    ]
  );
});
