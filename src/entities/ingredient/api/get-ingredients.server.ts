import 'server-only';

import { assertAppData, readAppJson } from '@/shared/db';

import type { Ingredient } from '../model/types';

const FILE = 'ingredients.json';

// 처음 한 번만 읽어 둔다. 읽기에 실패하면 비워서 다음 요청에서 다시 읽는다
let cached: Promise<Ingredient[]> | null = null;

function loadIngredients(): Promise<Ingredient[]> {
  cached ??= readAppJson<Ingredient[]>(FILE).catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
}

/** 입력할 수 있는 재료와 양념. 실제 데이터가 없으면 MissingAppDataError를 던진다 */
export async function getIngredients(): Promise<Ingredient[]> {
  assertAppData(FILE);
  return loadIngredients();
}
