import 'server-only';

import { readAppJson } from '@/shared/db';

import type { Recipe, RecipeDetail } from '../model/types';
import { fakeDetails, fakeRecipes } from './fake';

/** 추천에 쓰는 레시피 전체. 서버에서만 쓰고 브라우저로 그대로 보내지 않는다 */
export async function getRecipes(): Promise<Recipe[]> {
  'use cache';
  return (await readAppJson<Recipe[]>('recipes.json')) ?? fakeRecipes;
}

/** 레시피 하나의 요약과 조리 과정. 없으면 null */
export async function getRecipeDetail(id: number): Promise<RecipeDetail | null> {
  'use cache';
  // recipe-steps.json은 레시피 id를 키로 한 객체다
  const details = (await readAppJson<Record<string, RecipeDetail>>('recipe-steps.json')) ?? fakeDetails;
  return details[String(id)] ?? null;
}
