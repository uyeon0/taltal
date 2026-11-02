// @vitest-environment jsdom
// 결과 요약이 라벨 태그와 개수를 나눠 그려도 "다 써요 1개"처럼 이어 읽히는지 확인한다.

import assert from 'node:assert/strict';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, test } from 'vitest';

import type { Result } from '@/features/find-meals';
import type { Ingredient, InputUnit } from '@/entities/ingredient';
import { copy } from '@/shared/copy';

import { ResultSummary } from './result-summary';

afterEach(cleanup);

const make = (id: string, unitGrams: Partial<Record<InputUnit, number>>): Ingredient => ({
  id,
  aliases: [],
  pantry: null,
  unitGrams: { ...unitGrams, g: 1 },
  inputUnits: [...(Object.keys(unitGrams) as InputUnit[]), 'g'],
  gramsSource: 'AI 추정'
});
const ingredients = new Map([make('두부', { 모: 300 }), make('양파', { 개: 200 })].map((i) => [i.id, i]));

const result = (leftovers: Result['leftovers']): Result => ({
  status: 'ok',
  meals: [],
  shoppingList: [],
  leftovers,
  leftoverRatio: 0,
  leftoverScore: 0
});

const renderSummary = (leftovers: Result['leftovers']) =>
  render(
    <ResultSummary
      result={result(leftovers)}
      ingredients={ingredients}
      units={{ 두부: '모', 양파: '개' }}
      onOpenUsage={() => {}}
    />
  );

test('라벨 태그와 개수를 띄어 이어 읽는다', () => {
  renderSummary([
    { ingredientId: '두부', startGrams: 300, leftGrams: 0 },
    { ingredientId: '양파', startGrams: 200, leftGrams: 200 }
  ]);
  const usedUp = screen.getByText(copy.results.summaryUsedUpLabel).parentElement;
  const leftover = screen.getByText(copy.results.summaryLeftoverLabel).parentElement;
  assert.equal(usedUp?.textContent, `${copy.results.summaryUsedUpLabel} ${copy.results.summaryCount(1)}`);
  assert.equal(leftover?.textContent, `${copy.results.summaryLeftoverLabel} ${copy.results.summaryCount(1)}`);
});

test('남는 재료가 없으면 라벨 태그 없이 안내만 쓴다', () => {
  renderSummary([{ ingredientId: '두부', startGrams: 300, leftGrams: 0 }]);
  screen.getByText(copy.results.summaryNoLeftover);
  assert.equal(screen.queryByText(copy.results.summaryLeftoverLabel), null);
});
