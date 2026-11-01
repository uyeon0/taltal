import 'server-only';

import { assertAppData, readAppJson } from '@/shared/db';

import type { Recipe, RecipeDetail } from '../model/types';

const RECIPES = 'recipes.json';
// 레시피 id를 키로 한 객체다
const DETAILS = 'recipe-steps.json';

async function loadRecipes(): Promise<Recipe[]> {
  'use cache';
  return readAppJson<Recipe[]>(RECIPES);
}

async function loadDetails(): Promise<Record<string, RecipeDetail>> {
  'use cache';
  return readAppJson<Record<string, RecipeDetail>>(DETAILS);
}

/** 추천에 쓰는 레시피 전체. 서버에서만 쓰고 브라우저로 그대로 보내지 않는다. 실제 데이터가 없으면 MissingAppDataError를 던진다 */
export async function getRecipes(): Promise<Recipe[]> {
  assertAppData(RECIPES);
  return loadRecipes();
}

/** 레시피 하나의 요약과 조리 과정. 레시피가 없으면 null, 실제 데이터가 없으면 MissingAppDataError를 던진다 */
export async function getRecipeDetail(id: number): Promise<RecipeDetail | null> {
  assertAppData(DETAILS);
  return (await loadDetails())[String(id)] ?? null;
}
