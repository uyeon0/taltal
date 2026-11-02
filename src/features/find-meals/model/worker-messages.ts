import type { Ingredient, Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

import type { Comparison, Mode } from './compare';

/** 화면이 Worker에 보내는 계산 입력 */
export type FindMealOptionsRequest = {
  inventory: Stock[];
  servings: number;
  candidates: Recipe[];
  ingredients: Ingredient[];
};

/** Worker가 돌려주는 계산 결과 */
export type FindMealOptionsResponse = { ok: true; options: Record<Mode, Comparison> } | { ok: false; message: string };
