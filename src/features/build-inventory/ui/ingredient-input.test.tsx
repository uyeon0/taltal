// @vitest-environment jsdom
// 재료 선택 시트와 수량 편집이 요구사항의 확인 기준대로 동작하는지 확인한다.

import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, test } from 'vitest';

import type { Ingredient, InputUnit } from '@/entities/ingredient';

import { useInventory } from '../model/inventory-store';
import { AmountEditor } from './amount-editor';
import { IngredientPickerSheet } from './ingredient-picker-sheet';

const make = (id: string, unitGrams: Partial<Record<InputUnit, number>>, aliases: string[] = []): Ingredient => ({
  id,
  aliases,
  pantry: null,
  unitGrams: { ...unitGrams, g: 1 },
  inputUnits: [...(Object.keys(unitGrams) as InputUnit[]), 'g'],
  gramsSource: 'AI 추정'
});
const onion = make('양파', { 개: 200 });
const tofu = make('두부', { 모: 300 });
const egg = make('계란', { 개: 50 }, ['달걀']);
const INGREDIENTS = [onion, tofu, egg];

const store = () => useInventory.getState();

beforeEach(() => {
  store().reset();
  // jsdom에는 스크롤이 없다
  Element.prototype.scrollIntoView = () => {};
});
afterEach(cleanup);

/** 화면처럼 열고 닫는 상태를 가진 시트 */
function PickerHarness({ onAdded = () => {} }: { onAdded?: (ids: string[]) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        열기
      </button>
      <IngredientPickerSheet
        open={open}
        onOpenChange={setOpen}
        ingredients={INGREDIENTS}
        onAdded={(ids) => {
          onAdded(ids);
          setOpen(false);
        }}
      />
    </>
  );
}

const tile = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

test('여러 개 고르고 닫으면 담은 재료 목록은 그대로다', () => {
  render(<PickerHarness />);
  fireEvent.click(tile('양파'));
  fireEvent.click(tile('두부'));
  assert.equal(screen.getByRole('button', { name: '2개 담기' }).hasAttribute('disabled'), false);

  fireEvent.click(screen.getByRole('button', { name: '닫기' }));
  assert.deepEqual(store().items, []);
});

test('검색으로 가린 재료도 고른 상태를 유지하고, 고른 순서로 담는다', () => {
  let added: string[] = [];
  render(<PickerHarness onAdded={(ids) => (added = ids)} />);
  fireEvent.click(tile('두부'));

  const search = screen.getByRole('searchbox');
  fireEvent.change(search, { target: { value: '달걀' } });
  assert.equal(screen.queryByRole('button', { name: /^두부/ }), null);
  fireEvent.click(tile('계란'));

  fireEvent.change(search, { target: { value: '' } });
  assert.equal(tile('두부').getAttribute('aria-pressed'), 'true');

  fireEvent.click(screen.getByRole('button', { name: '2개 담기' }));
  assert.deepEqual(added, ['두부', '계란']);
  assert.deepEqual(store().items, [
    { ingredientId: '두부', amount: null, unit: '모' },
    { ingredientId: '계란', amount: null, unit: '개' }
  ]);
});

test('이미 담은 재료는 고를 수 없고 "담김"으로 보인다. 고른 것이 없으면 담기가 비활성이고 이유를 알린다', () => {
  store().addItems([{ ingredientId: '양파', unit: '개' }]);
  render(<PickerHarness />);
  const onionTile = tile('양파');
  assert.equal(onionTile.hasAttribute('disabled'), true);
  assert.match(onionTile.textContent ?? '', /담김/);

  const addButton = screen.getByRole('button', { name: '0개 담기' });
  assert.equal(addButton.hasAttribute('disabled'), true);
  const reason = document.getElementById(addButton.getAttribute('aria-describedby')!);
  assert.equal(reason?.textContent, '재료를 고르면 담을 수 있어요.');
});

test('검색 결과가 없으면 안내와 검색어 지우기를 보여 준다', () => {
  render(<PickerHarness />);
  const search = screen.getByRole('searchbox');
  fireEvent.change(search, { target: { value: '망고' } });
  screen.getByText('"망고"는 목록에 없어요. 다른 이름으로 찾아보세요.');
  fireEvent.click(screen.getByRole('button', { name: '검색어 지우기' }));
  assert.equal((search as HTMLInputElement).value, '');
  assert.ok(tile('양파'));
});

function renderEditor(ingredient: Ingredient, onAmountSet: (id: string) => void = () => {}) {
  const item = store().items.find((i) => i.ingredientId === ingredient.id)!;
  return render(
    <AmountEditor
      id="editor"
      ingredient={ingredient}
      item={item}
      onAmountSet={onAmountSet}
      onRemove={() => {}}
      onTypingChange={() => {}}
    />
  );
}

test('빠른 수량 버튼을 누르면 양이 정해지고 화면에 다음 재료로 넘기라고 알린다', () => {
  store().addItems([{ ingredientId: '양파', unit: '개' }]);
  let done: string | null = null;
  renderEditor(onion, (id) => (done = id));
  fireEvent.click(screen.getByRole('button', { name: '½개' }));
  assert.deepEqual(store().items[0], { ingredientId: '양파', amount: 0.5, unit: '개' });
  assert.equal(done, '양파');
});

test('범위를 벗어난 값에서 오류가 보이고 입력칸과 연결된다', () => {
  store().addItems([{ ingredientId: '양파', unit: '개' }]);
  renderEditor(onion);
  fireEvent.click(screen.getByRole('button', { name: '직접 입력' }));
  const input = screen.getByLabelText('직접 입력');
  fireEvent.change(input, { target: { value: '100001' } });
  fireEvent.click(screen.getByRole('button', { name: '이 양으로 정하기' }));

  assert.equal(input.getAttribute('aria-invalid'), 'true');
  const error = document.getElementById(input.getAttribute('aria-describedby')!);
  assert.equal(error?.textContent, '0보다 크고 100,000 이하로 넣어 주세요.');
  assert.equal(store().items[0].amount, null);
});

test('단위를 바꾸면 숫자가 환산되고, 저장하면 고른 단위로 남는다', () => {
  store().addItems([{ ingredientId: '양파', unit: '개' }]);
  renderEditor(onion);
  fireEvent.click(screen.getByRole('button', { name: '직접 입력' }));
  const input = screen.getByLabelText('직접 입력') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '1.5' } });
  fireEvent.click(screen.getByRole('radio', { name: 'g' }));
  assert.equal(input.value, '300');
  fireEvent.click(screen.getByRole('radio', { name: '개' }));
  assert.equal(input.value, '1.5');
  fireEvent.click(screen.getByRole('radio', { name: 'g' }));
  fireEvent.click(screen.getByRole('button', { name: '이 양으로 정하기' }));
  assert.deepEqual(store().items[0], { ingredientId: '양파', amount: 300, unit: 'g' });
});
