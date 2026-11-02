// 레시피 상세 시트의 요리 하나를 PNG로 그린다. 글은 데이터 파일과 고정 문구에서만 가져오고, 본문으로는 화면에만 있는 양과 단위를 받는다.

import { ImageResponse } from 'next/og';

import type { Meal } from '@/features/find-meals';
import { INPUT_UNITS } from '@/entities/ingredient';
import { getIngredients } from '@/entities/ingredient/index.server';
import { getRecipeDetail, getRecipes } from '@/entities/recipe/index.server';
import { SITE } from '@/shared/config/site';
import {
  RECIPE_IMAGE_WIDTH,
  RecipeImage,
  WORDMARK_HEIGHT,
  toRecipeDetailView,
  type RecipeImageColors,
  type RecipeImageRequest,
  type Wordmark
} from '@/widgets/recipe-detail-sheet/index.server';

import { loadGumiFont, loadSuitFonts } from '../fonts/image-fonts.server';
import { loadImageColors } from '../styles/image-colors.server';
import { readJsonBody } from './read-json-body';
import { serverError } from './server-error';

// 상한은 POST /api/candidates와 같은 이유로 둔다. 화면이 보내는 양보다 넉넉하다
const MAX_ITEMS = 100;
const MAX_ID_LENGTH = 50;
const MAX_GRAMS = 10_000_000;
const MAX_DAY = 5;
const MAX_BODY_BYTES = 32 * 1024;

const isId = (x: unknown): x is string => typeof x === 'string' && x.length <= MAX_ID_LENGTH;
const isGrams = (x: unknown): x is number => Number.isFinite(x) && (x as number) >= 0 && (x as number) <= MAX_GRAMS;
const isList = (x: unknown): x is unknown[] => Array.isArray(x) && x.length <= MAX_ITEMS;
const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

function isBody(x: unknown): x is RecipeImageRequest {
  if (!isRecord(x)) return false;
  const { day, uses, toBuy, shoppingList, units } = x;
  return (
    Number.isInteger(day) &&
    (day as number) >= 1 &&
    (day as number) <= MAX_DAY &&
    isList(uses) &&
    uses.every((u) => isRecord(u) && isId(u.ingredientId) && isGrams(u.grams)) &&
    isList(toBuy) &&
    toBuy.every(isId) &&
    isList(shoppingList) &&
    shoppingList.every(
      (s) => isRecord(s) && isId(s.ingredientId) && isGrams(s.grams) && typeof s.optional === 'boolean'
    ) &&
    isRecord(units) &&
    Object.keys(units).length <= MAX_ITEMS &&
    Object.entries(units).every(([id, unit]) => isId(id) && (INPUT_UNITS as readonly unknown[]).includes(unit))
  );
}

let wordmark: Promise<Wordmark> | undefined;

/** 서비스 이름을 낭만있구미체만으로 그린다. 요청과 상관없어 처음 한 번만 그린다 */
function loadWordmark(colors: RecipeImageColors): Promise<Wordmark> {
  wordmark ??= (async () => {
    const res = new ImageResponse(
      <div
        style={{
          display: 'flex',
          fontFamily: 'GumiRomance',
          fontSize: WORDMARK_HEIGHT * 2,
          lineHeight: 1,
          color: colors.ink
        }}
      >
        {SITE.name}
      </div>,
      // width, height를 undefined로 넘기면 글자 크기에 맞춰 그린다. 빼면 1200×630이 된다
      { width: undefined, height: undefined, fonts: await loadGumiFont() }
    );
    const png = Buffer.from(await res.arrayBuffer());
    // PNG IHDR의 가로, 세로
    return {
      src: `data:image/png;base64,${png.toString('base64')}`,
      width: png.readUInt32BE(16),
      height: png.readUInt32BE(20)
    };
  })().catch((error: unknown) => {
    wordmark = undefined;
    throw error;
  });
  return wordmark;
}

export async function POST(request: Request, ctx: RouteContext<'/api/recipes/[id]/image'>) {
  const raw = (await ctx.params).id;
  // GET /api/recipes/[id]와 같은 번호 규칙이다
  const id = /^(0|[1-9]\d*)$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id)) return Response.json({ error: '잘못된 레시피 번호입니다.' }, { status: 400 });

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!isBody(body)) return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  try {
    const [recipes, detail, ingredients] = await Promise.all([getRecipes(), getRecipeDetail(id), getIngredients()]);
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe || !detail) return Response.json({ error: '레시피를 찾지 못했습니다.' }, { status: 404 });

    const meal: Meal = {
      recipeId: id,
      name: recipe.name,
      uses: body.uses,
      toBuy: body.toBuy,
      day: body.day,
      // 이미지에 쓰지 않는 값이다
      pantryNeeded: [],
      urgency: null,
      urgentIngredients: []
    };
    const view = toRecipeDetailView(meal, body.shoppingList, recipe, detail, ingredients, body.units);
    const colors = await loadImageColors();
    const [fonts, mark] = await Promise.all([loadSuitFonts(), loadWordmark(colors)]);

    const image = new ImageResponse(<RecipeImage view={view} wordmark={mark} url={SITE.url} colors={colors} />, {
      width: RECIPE_IMAGE_WIDTH,
      // undefined를 넘기면 내용 높이로 그린다. 빼면 630px로 잘린다
      height: undefined,
      fonts
    });
    // ImageResponse는 그리기 오류를 본문 스트림에서 던지므로, 여기서 다 그려 500으로 바꿀 수 있게 한다
    const png = await image.arrayBuffer();
    return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return serverError(error);
  }
}
