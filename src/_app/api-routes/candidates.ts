// 가진 재료로 묶음 탐색에 넣을 후보 레시피를 고른다. 레시피 전체는 브라우저로 보내지 않는다.

import type { Stock } from '@/entities/ingredient';
import { getRecipes } from '@/entities/recipe/index.server';
import { filterCandidates } from '@/features/find-meals/index.server';

import { preflight, withCors } from './cors';
import { readJsonBody } from './read-json-body';
import { serverError } from './server-error';

type Body = { inventory: Stock[]; servings: number };

// 화면이 보내는 양보다 넉넉한 상한. 지나치게 큰 요청을 처리하지 않으려는 것이다
const MAX_INVENTORY = 200;
const MAX_ID_LENGTH = 50;
// 재료 하나의 g 상한(10톤). 큰 값을 더하다 무한대가 되어 점수 계산이 깨지지 않게 한다
const MAX_GRAMS = 10_000_000;
// 재료 200개를 담아도 넉넉한 본문 크기
const MAX_BODY_BYTES = 32 * 1024;

function isBody(x: unknown): x is Body {
  if (typeof x !== 'object' || x === null) return false;
  const b = x as Body;
  return (
    Array.isArray(b.inventory) &&
    b.inventory.length <= MAX_INVENTORY &&
    b.inventory.every(
      (s) =>
        typeof s?.ingredientId === 'string' &&
        s.ingredientId.length <= MAX_ID_LENGTH &&
        Number.isFinite(s?.grams) &&
        s.grams >= 0 &&
        s.grams <= MAX_GRAMS
    ) &&
    Number.isInteger(b.servings) &&
    b.servings >= 1 &&
    b.servings <= 10
  );
}

export const POST = withCors('POST', async (request: Request) => {
  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!isBody(body)) return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  try {
    const candidates = filterCandidates(await getRecipes(), body.inventory, body.servings);
    return Response.json({ candidates });
  } catch (error) {
    return serverError(error);
  }
});

export const OPTIONS = preflight('POST');
