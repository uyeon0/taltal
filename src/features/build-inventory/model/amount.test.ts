// 수량 입력 규칙(빠른 수량, 직접 입력 검사, 단위 환산, 표시)을 확인한다.
// 마지막 묶음만 실제 데이터(data/app/ingredients.json, 또는 APP_DATA_DIR)를 쓰고, 데이터가 없으면 건너뛴다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

import type { Ingredient, InputUnit } from '@/entities/ingredient';
import { appDataPath } from '@/shared/db';

import { changeDraftUnit, createDraft, draftAmount, editDraftText, parseAmount } from './amount-input';
import { formatQuantity } from './format-quantity';
import { quickAmounts } from './quick-amounts';

const make = (id: string, unitGrams: Partial<Record<InputUnit, number>>): Ingredient => ({
  id,
  aliases: [],
  pantry: null,
  unitGrams: { ...unitGrams, g: 1 },
  inputUnits: [...(Object.keys(unitGrams) as InputUnit[]), 'g'],
  gramsSource: 'AI 추정'
});
const onion = make('양파', { 개: 200 });
const radish = make('무', { 개: 1500 });
const cabbage = make('배추', { 포기: 2500 });
const egg = make('계란', { 개: 50 });
const beef = make('쇠고기', {});

test('빠른 수량은 기본 단위의 무게로 정한다', () => {
  assert.deepEqual(quickAmounts(beef), { unit: 'g', amounts: [100, 200, 300] });
  assert.deepEqual(quickAmounts(egg), { unit: '개', amounts: [2, 5, 10] });
  assert.deepEqual(quickAmounts(onion), { unit: '개', amounts: [0.5, 1, 2] });
  // 100g이면 "100g 미만"이 아니다
  assert.deepEqual(quickAmounts(make('가래떡', { 줄: 100 })).amounts, [0.5, 1, 2]);
});

test('직접 입력은 0 초과 100,000 이하, g으로 10,000,000 이하만 받는다', () => {
  for (const text of ['', '  ', '양파', '0', '-1', '100000.1', 'Infinity']) {
    assert.equal(parseAmount(text, onion, '개'), null, JSON.stringify(text));
  }
  assert.equal(parseAmount(' 1.5 ', onion, '개'), 1.5);
  assert.equal(parseAmount('100000', beef, 'g'), 100_000);
  // 배추 4,000포기는 10,000,000g이라 받고, 4,001포기는 넘는다
  assert.equal(parseAmount('4000', cabbage, '포기'), 4000);
  assert.equal(parseAmount('4001', cabbage, '포기'), null);
});

test('단위를 오가도 처음 양으로 돌아온다', () => {
  let draft = editDraftText(createDraft(onion, null, '개'), onion, '1');
  draft = changeDraftUnit(draft, onion, 'g');
  assert.equal(draft.text, '200');
  draft = changeDraftUnit(draft, onion, '개');
  assert.equal(draft.text, '1');
  assert.equal(draftAmount(draft, onion), 1);

  // 반올림해 보여도 저장하는 양은 처음 g과 같다
  let small = editDraftText(createDraft(radish, null, 'g'), radish, '100');
  small = changeDraftUnit(small, radish, '개');
  assert.equal(small.text, '0.07');
  assert.equal(draftAmount(small, radish)! * 1500, 100);
  small = changeDraftUnit(small, radish, 'g');
  assert.equal(small.text, '100');
});

test('환산한 숫자를 고치면 고친 값을 저장한다', () => {
  let draft = editDraftText(createDraft(radish, null, 'g'), radish, '100');
  draft = changeDraftUnit(draft, radish, '개');
  draft = editDraftText(draft, radish, '0.5');
  assert.equal(draftAmount(draft, radish), 0.5);
});

test('저장한 값을 다시 열면 반올림해 보여도 그대로 저장한다', () => {
  const draft = createDraft(radish, 1 / 15, '개');
  assert.equal(draft.text, '0.07');
  assert.equal(draftAmount(draft, radish), 1 / 15);
  assert.equal(createDraft(onion, 1.5, '개').text, '1.5');
});

test('정한 양은 사용자가 넣은 값 그대로 보여 준다', () => {
  assert.equal(formatQuantity(0.5, '개'), '½개');
  assert.equal(formatQuantity(0.25, '단'), '¼단');
  assert.equal(formatQuantity(0.75, '모'), '¾모');
  assert.equal(formatQuantity(2, '개'), '2개');
  assert.equal(formatQuantity(1.25, '봉지'), '1.25봉지');
  assert.equal(formatQuantity(1500, 'g'), '1,500g');
  assert.equal(formatQuantity(1 / 15, '개'), '0.07개');
  // 반올림해 0이 되는 양수는 0으로 보이지 않는다
  assert.equal(formatQuantity(0.0004, '포기'), '0.0004포기');
});

const dataFile = appDataPath('ingredients.json');
const ingredients: Ingredient[] = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf-8')) : [];

test.skipIf(ingredients.length === 0)(
  '실제 재료 전체가 빠른 수량 버튼 세 개를 받고, 그 값은 직접 입력 범위 안이다',
  () => {
    for (const ingredient of ingredients.filter((i) => i.pantry === null)) {
      const { unit, amounts } = quickAmounts(ingredient);
      assert.equal(unit, ingredient.inputUnits[0], ingredient.id);
      assert.equal(amounts.length, 3, ingredient.id);
      for (const amount of amounts) assert.notEqual(parseAmount(String(amount), ingredient, unit), null, ingredient.id);
    }
  }
);
