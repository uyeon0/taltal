// 재료 그림 경로가 public/의 실제 파일을 가리키는지, 사용자가 고르는 재료가 모두 그림을 받는지 확인한다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

import { appDataPath } from '@/shared/db';

import { INGREDIENT_FALLBACK_IMAGE, INGREDIENT_IMAGES } from './ingredient-images';
import type { Ingredient } from './types';

test('모든 재료 그림 경로에 파일이 있다', () => {
  for (const src of [...Object.values(INGREDIENT_IMAGES), INGREDIENT_FALLBACK_IMAGE]) {
    assert.ok(existsSync(path.join('public', src)), `${src} 파일이 없다`);
  }
});

const dataFile = appDataPath('ingredients.json');

test.skipIf(!existsSync(dataFile))('사용자가 고르는 재료가 모두 전용 그림을 받는다', () => {
  const ingredients: Ingredient[] = JSON.parse(readFileSync(dataFile, 'utf8'));
  const withoutImage = ingredients
    .filter((ingredient) => ingredient.pantry === null && !INGREDIENT_IMAGES[ingredient.id])
    .map((ingredient) => ingredient.id);
  // 그림이 없어도 대체 그림으로 동작하지만, 지금 데이터는 모두 그림이 있다. 데이터가 바뀌면 그림 매핑을 다시 만든다
  assert.deepEqual(withoutImage, []);
});
