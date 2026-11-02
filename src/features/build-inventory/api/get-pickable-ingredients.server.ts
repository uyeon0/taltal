import 'server-only';

import { getIngredients } from '@/entities/ingredient/index.server';
import { getRecipes } from '@/entities/recipe/index.server';

import { orderPickable, type PickableIngredients } from '../model/pickable';

/** 재료 입력 화면이 쓰는 재료 목록. 실제 데이터가 없으면 MissingAppDataError를 던진다 */
export async function getPickableIngredients(): Promise<PickableIngredients> {
  const [ingredients, recipes] = await Promise.all([getIngredients(), getRecipes()]);
  return orderPickable(ingredients, recipes);
}
