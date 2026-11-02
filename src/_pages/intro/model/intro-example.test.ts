// 소개 3장 막대의 조각 합이 처음 양과 같은지 확인한다. 막대마다 그 재료의 처음 양을 100%로 그리기 때문이다.

import assert from 'node:assert/strict';
import { test } from 'vitest';

import { copy } from '@/shared/copy';

import { INTRO_EXAMPLE_GRAMS } from './intro-example';

test('요리별 양과 남는 양을 더하면 처음 양이다', () => {
  const { start, meals, left } = INTRO_EXAMPLE_GRAMS;
  assert.equal(
    meals.reduce<number>((sum, grams) => sum + grams, left),
    start
  );
});

test('요리 수가 예시 문구와 같다', () => {
  assert.equal(INTRO_EXAMPLE_GRAMS.meals.length, copy.intro.exampleMeals.length);
});
