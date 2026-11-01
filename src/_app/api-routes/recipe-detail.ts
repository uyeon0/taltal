// 레시피 하나의 요약과 조리 과정을 돌려준다. 상세 시트를 열 때만 부른다.

import { getRecipeDetail } from '@/entities/recipe/index.server';

import { serverError } from './server-error';

export async function GET(_request: Request, ctx: RouteContext<'/api/recipes/[id]'>) {
  const raw = (await ctx.params).id;
  // 0x10, 1e1, 12.0처럼 숫자로 읽히는 다른 표기는 받지 않는다
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id)) return Response.json({ error: '잘못된 레시피 번호입니다.' }, { status: 400 });

  try {
    const detail = await getRecipeDetail(id);
    if (!detail) return Response.json({ error: '레시피를 찾지 못했습니다.' }, { status: 404 });
    return Response.json(detail);
  } catch (error) {
    return serverError(error);
  }
}
