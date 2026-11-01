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
  // 데이터 계약의 약속이다. 추천 계산은 같은 재료가 두 줄이어도 합쳐서 처리하지만,
  // 화면은 재료마다 원문 분량(amountText) 한 줄을 보여 주므로 한 줄로 합쳐 와야 한다
  for (const r of recipes) {
    const ids = r.ingredients.map((i) => i.ingredientId);
    assert.equal(new Set(ids).size, ids.length, `${r.id} ${r.name}`);
  }
});
