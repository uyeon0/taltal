import type { Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

/** 브라우저에서 가진 재료에 맞는 후보 레시피를 받는다. 실패하면 오류를 던진다 */
export async function fetchCandidates(inventory: Stock[], servings: number, signal?: AbortSignal): Promise<Recipe[]> {
  const res = await fetch('/api/candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inventory, servings }),
    signal
  });
  if (!res.ok) throw new Error(`후보 요청 실패: ${res.status}`);
  const { candidates } = (await res.json()) as { candidates: Recipe[] };
  return candidates;
}
