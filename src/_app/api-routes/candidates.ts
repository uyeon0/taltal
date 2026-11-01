// 가진 재료로 묶음 탐색에 넣을 후보 레시피를 고른다. 레시피 전체는 브라우저로 보내지 않는다.

import type { Stock } from '@/entities/ingredient';
import { getRecipes } from '@/entities/recipe/index.server';
import { filterCandidates } from '@/features/find-meals';

type Body = { inventory: Stock[]; servings: number };

function isBody(x: unknown): x is Body {
  if (typeof x !== 'object' || x === null) return false;
  const b = x as Body;
  return (
    Array.isArray(b.inventory) &&
    b.inventory.every((s) => typeof s?.ingredientId === 'string' && Number.isFinite(s?.grams) && s.grams >= 0) &&
    Number.isInteger(b.servings) &&
    b.servings >= 1 &&
    b.servings <= 10
  );
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isBody(body)) return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const candidates = filterCandidates(await getRecipes(), body.inventory, body.servings);
  return Response.json({ candidates });
}
