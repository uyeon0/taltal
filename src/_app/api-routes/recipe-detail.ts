// 레시피 하나의 요약과 조리 과정을 돌려준다. 상세 시트를 열 때만 부른다.

import { getRecipeDetail } from '@/entities/recipe/index.server';

import { serverError } from './server-error';

export async function GET(_request: Request, ctx: RouteContext<'/api/recipes/[id]'>) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: '잘못된 레시피 번호입니다.' }, { status: 400 });

  try {
    const detail = await getRecipeDetail(id);
    if (!detail) return Response.json({ error: '레시피를 찾지 못했습니다.' }, { status: 404 });
    return Response.json(detail);
  } catch (error) {
    return serverError(error);
  }
}
