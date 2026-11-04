import 'server-only';

import { assertAppData, readAppJson } from '@/shared/db';

import type { Recipe, RecipeDetail } from '../model/types';

const RECIPES = 'recipes.json';
// 레시피 id를 키로 한 객체다
const DETAILS = 'recipe-steps.json';

/** 파일을 처음 한 번만 읽어 두는 함수를 만든다. 읽기에 실패하면 비워서 다음 요청에서 다시 읽는다 */
function readOnce<T>(file: string): () => Promise<T> {
  let cached: Promise<T> | null = null;
  return () => {
    cached ??= readAppJson<T>(file).catch((error: unknown) => {
      cached = null;
      throw error;
    });
    return cached;
  };
}

const loadRecipes = readOnce<Recipe[]>(RECIPES);
const loadDetails = readOnce<Record<string, RecipeDetail>>(DETAILS);

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
