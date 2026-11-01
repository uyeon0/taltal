import 'server-only';

import { readAppJson } from '@/shared/db';

import type { Ingredient } from '../model/types';
import { fakeIngredients } from './fake';

/** 입력할 수 있는 재료와 양념. 실제 데이터가 없으면 가짜 재료를 쓴다 */
export async function getIngredients(): Promise<Ingredient[]> {
  'use cache';
  return (await readAppJson<Ingredient[]>('ingredients.json')) ?? fakeIngredients;
}
