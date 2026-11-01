// 실행: npm test
// 규칙 표는 amount-format.ts 머리말과 docs/design.md "잔량·수량 표기 규칙"을 따른다.
// 마지막 묶음만 실제 데이터(data/app/ingredients.json, 또는 APP_DATA_DIR)를 쓰고, 데이터가 없으면 건너뛴다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

import { appDataPath } from '@/shared/db';

import { amountsReconcile, describeAmount, formatAmount } from './amount-format';
import type { Ingredient, InputUnit } from './types';

const make = (id: string, unitGrams: Partial<Record<InputUnit, number>>): Ingredient => ({
  id,
  aliases: [],
  pantry: null,
  unitGrams: { ...unitGrams, g: 1 },
  inputUnits: [...(Object.keys(unitGrams) as InputUnit[]), 'g'],
  gramsSource: null
});
const onion = make('양파', { 개: 200 });
const tofu = make('두부', { 모: 300 });
const bean = make('콩나물', { 봉지: 200 });
const beef = make('쇠고기', {});
const round1 = (n: number) => Math.round(n * 10) / 10;

test('정확한 값에만 분수를 쓴다', () => {
  const cases: [number, string][] = [
    [50, '¼개'],
    [100, '½개'],
    [150, '¾개'],
    [200, '1개'],
    [250, '1¼개'],
    [300, '1½개'],
    [400, '2개'],
    [2000 / 3, '3⅓개']
  ];
  for (const [g, text] of cases) assert.equal(formatAmount(onion, g, '개'), text, `${g}g`);
  assert.equal(formatAmount(tofu, 100, '모'), '⅓모');
  assert.equal(formatAmount(tofu, 200, '모'), '⅔모');
});

test('0.1g 단위로 반올림돼 온 값도 환산 오차 안이면 분수로 본다', () => {
  assert.equal(formatAmount(tofu, round1(100), '모'), '⅓모');
  assert.equal(formatAmount(onion, round1(200 / 3), '개'), '⅓개'); // 66.7g
  assert.equal(formatAmount(onion, round1((200 * 2) / 3), '개'), '⅔개'); // 133.3g
  assert.equal(formatAmount(onion, round1((200 * 4) / 3), '개'), '1⅓개'); // 266.7g
  // 오차 허용(0.1g)을 넘으면 분수가 아니다
  assert.equal(formatAmount(onion, 67.5, '개'), '약 0.3개');
});

test("분수가 아니어도 소수 한 자리로 맞으면 그대로, 아니면 '약'을 붙인다", () => {
  assert.equal(formatAmount(onion, 40, '개'), '0.2개');
  assert.equal(formatAmount(onion, 220, '개'), '1.1개');
  assert.equal(formatAmount(onion, 74, '개'), '약 0.4개'); // 0.37
  assert.equal(formatAmount(onion, 62, '개'), '약 0.3개'); // 0.31
  assert.equal(formatAmount(onion, 193, '개'), '약 1개'); // 0.965. 정확히 1개가 아니므로 '약'을 떼지 않고, 소수 .0은 쓰지 않는다
  assert.equal(describeAmount(onion, 74, '개').kind, 'approx');
  assert.equal(describeAmount(onion, 100, '개').kind, 'exact');
});

test('작은 양수는 0으로 보이지 않는다', () => {
  assert.equal(formatAmount(onion, 10, '개'), '0.1개 미만(10g)');
  assert.equal(formatAmount(onion, 0.5, '개'), '0.1개 미만(0.5g)');
  assert.equal(formatAmount(onion, 0.04, '개'), '0.1개 미만(0.1g 미만)');
  assert.equal(formatAmount(onion, 19, '개'), '0.1개 미만(19g)');
  assert.equal(formatAmount(onion, 20, '개'), '0.1개');
  assert.equal(formatAmount(beef, 0.05, 'g'), '0.1g 미만');
  assert.equal(formatAmount(beef, 0.1, 'g'), '0.1g');
  assert.equal(describeAmount(onion, 10, '개').kind, 'tiny');
  assert.equal(describeAmount(onion, 10, '개').value, null);
});

test('0은 실제 0일 때만 쓴다', () => {
  assert.equal(formatAmount(onion, 0, '개'), '0개');
  assert.equal(formatAmount(beef, 0, 'g'), '0g');
  assert.equal(describeAmount(onion, 0, '개').kind, 'zero');
  for (const g of [0.01, 0.1, 0.5, 1, 5, 19]) {
    assert.doesNotMatch(formatAmount(onion, g, '개'), /^0개/, `${g}g`);
    assert.doesNotMatch(formatAmount(beef, g, 'g'), /^0g/, `${g}g`);
  }
});

test('1g 미만을 다 쓴 것으로 보는 판정은 표시와 별개다: 0.5g이어도 양은 0으로 만들지 않는다', () => {
  assert.equal(formatAmount(onion, 0.5, '개'), '0.1개 미만(0.5g)');
  assert.notEqual(formatAmount(onion, 0.9, '개'), '0개');
});

test('g 입력은 g로, g 환산값은 환산 근거가 있을 때만 병기한다', () => {
  assert.equal(formatAmount(beef, 150, 'g'), '150g');
  assert.equal(formatAmount(beef, 37.5, 'g'), '37.5g');
  assert.equal(formatAmount(onion, 150, 'g'), '150g');
  assert.equal(formatAmount(onion, 50, '개', { withGrams: true }), '¼개 (50g)');
  assert.equal(formatAmount(onion, 74, '개', { withGrams: true }), '약 0.4개 (74g)');
  assert.equal(formatAmount(onion, 10, '개', { withGrams: true }), '0.1개 미만(10g)');
  assert.equal(formatAmount(onion, 0, '개', { withGrams: true }), '0개');
  assert.equal(formatAmount(beef, 150, 'g', { withGrams: true }), '150g');
  // 환산 근거가 없는 단위는 g으로 보여 준다
  assert.equal(formatAmount(beef, 150, '개'), '150g');
});

test('표시한 부분의 합과 전체가 맞는지 알려 준다', () => {
  // 분수끼리는 맞는다: ¼ + ¼ + ½ = 1
  assert.equal(amountsReconcile(onion, '개', [50, 50, 100], 200), true);
  // 근삿값이 섞이면 어긋난다: 약 0.4 + 약 0.4 = 0.8, 전체는 약 0.7
  assert.equal(describeAmount(onion, 74, '개').text, '약 0.4개');
  assert.equal(describeAmount(onion, 148, '개').text, '약 0.7개');
  assert.equal(amountsReconcile(onion, '개', [74, 74], 148), false);
  // 0.1 단위 미만이 있으면 더할 수 없다
  assert.equal(amountsReconcile(onion, '개', [190, 10], 200), false);
  // 실제 0은 더해도 된다
  assert.equal(amountsReconcile(onion, '개', [100, 100, 0], 200), true);
  // 내부 g 값은 어긋나지 않는다 (막대 비율은 이쪽으로 구한다)
  assert.equal(74 + 74, 148);
});

test('분수 단위 한 칸씩 올라가는 값은 어느 단위에서도 0으로 보이거나 분수 오표시가 되지 않는다', () => {
  for (const [ing, unit, per] of [
    [onion, '개', 200],
    [tofu, '모', 300],
    [bean, '봉지', 200]
  ] as const) {
    for (let g = 0.1; g <= per * 3; g = round1(g + 0.1)) {
      const view = describeAmount(ing, g, unit);
      assert.notEqual(view.kind, 'zero', `${g}g`);
      assert.doesNotMatch(view.text, /^0[^.\d]/, `${g}g → ${view.text}`);
      // 정확한 값이라고 한 것은 g로 되돌렸을 때 오차 허용 범위 안이어야 한다
      if (view.kind === 'exact') assert.ok(Math.abs(view.value! * per - g) <= 0.1 + 1e-9, `${g}g → ${view.text}`);
      if (view.kind === 'approx') assert.match(view.text, /^약 /);
    }
  }
});

// 실제 데이터의 모든 입력 단위에서 작은 양수가 0으로 나오지 않고 분수가 정확히 g으로 돌아오는지 본다
// 앱과 같은 경로에서 실제 데이터를 찾는다
const dataFile = appDataPath('ingredients.json');
const ingredients: Ingredient[] = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf-8')) : [];
// 실제 데이터가 없으면 데이터로 도는 테스트는 건너뛴다
const dataTest = test.skipIf(ingredients.length === 0);

dataTest('실제 재료 전체: 양수가 0으로 보이지 않는다', () => {
  for (const ing of ingredients.filter((i) => i.inputUnits.length > 0)) {
    for (const unit of ing.inputUnits) {
      for (const g of [0.1, 0.5, 1, 2.5, 5, 10, 37.5, 100, 333.3]) {
        const text = formatAmount(ing, g, unit);
        assert.doesNotMatch(text, /^0[^.\d]/, `${ing.id} ${g}g ${unit} → ${text}`);
      }
      assert.match(formatAmount(ing, 0, unit), /^0/);
    }
  }
});

dataTest('실제 재료 전체: 정확한 값은 g으로 되돌렸을 때 오차 허용 범위 안이다', () => {
  for (const ing of ingredients.filter((i) => i.inputUnits.length > 0)) {
    for (const unit of ing.inputUnits) {
      const per = ing.unitGrams[unit]!;
      for (const frac of [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.25, 2.5]) {
        const g = round1(per * frac);
        const view = describeAmount(ing, g, unit);
        if (view.kind === 'exact')
          assert.ok(Math.abs(view.value! * per - g) <= 0.1 + 1e-9, `${ing.id} ${g}g ${unit} → ${view.text}`);
      }
    }
  }
});
