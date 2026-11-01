// 레시피 데이터가 docs/data-contract.md의 약속을 지키는지 확인한다. 추천 계산이 이 약속에 기대기 때문이다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

import { appDataPath } from '@/shared/db';

import type { Recipe } from './types';

// 앱과 같은 경로에서 실제 데이터를 찾는다
const dataFile = appDataPath('recipes.json');
const recipes: Recipe[] = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf-8')) : [];

test.skipIf(recipes.length === 0)('한 레시피에는 같은 재료가 한 줄만 있다', () => {
  // 후보 고르기는 재료 줄마다 재고와 비교하므로, 같은 재료가 두 줄이면 합을 보지 못한다
  for (const r of recipes) {
    const ids = r.ingredients.map((i) => i.ingredientId);
    assert.equal(new Set(ids).size, ids.length, `${r.id} ${r.name}`);
  }
});
