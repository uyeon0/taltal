import 'server-only';

import { assertAppData, readAppJson } from '@/shared/db';

import type { Ingredient } from '../model/types';

const FILE = 'ingredients.json';

async function loadIngredients(): Promise<Ingredient[]> {
  'use cache';
  return readAppJson<Ingredient[]>(FILE);
}

/** 입력할 수 있는 재료와 양념. 실제 데이터가 없으면 MissingAppDataError를 던진다 */
export async function getIngredients(): Promise<Ingredient[]> {
  assertAppData(FILE);
  return loadIngredients();
}
