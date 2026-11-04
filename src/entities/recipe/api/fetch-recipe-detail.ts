import { apiUrl } from '@/shared/config';

import type { RecipeDetail } from '../model/types';

/** 브라우저에서 레시피 상세 하나를 받는다. 실패하면 오류를 던진다 */
export async function fetchRecipeDetail(id: number, signal?: AbortSignal): Promise<RecipeDetail> {
  const res = await fetch(apiUrl(`/api/recipes/${id}`), { signal });
  if (!res.ok) throw new Error(`레시피 상세 요청 실패: ${res.status}`);
  return (await res.json()) as RecipeDetail;
}
