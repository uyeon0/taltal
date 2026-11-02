// 레시피 이미지를 서버에서 받아 저장한다. 파일 공유를 지원하면 공유 시트를 열고, 아니면 PNG를 내려받는다.

import type { Meal, Result } from '@/features/find-meals';
import type { InputUnit } from '@/entities/ingredient';
import { SITE } from '@/shared/config/site';

/** POST /api/recipes/[id]/image의 본문. 요리 이름과 레시피 글은 서버가 데이터에서 읽는다 */
export type RecipeImageRequest = {
  day: Meal['day'];
  uses: Meal['uses'];
  toBuy: Meal['toBuy'];
  shoppingList: Result['shoppingList'];
  units: Record<string, InputUnit>;
};

export function toRecipeImageRequest(
  meal: Meal,
  shoppingList: Result['shoppingList'],
  units: Readonly<Record<string, InputUnit>>
): RecipeImageRequest {
  return { day: meal.day, uses: meal.uses, toBuy: meal.toBuy, shoppingList, units: { ...units } };
}

/** 레시피 이미지를 받는다. 실패하면 오류를 던진다 */
export async function requestRecipeImage(
  recipeId: number,
  body: RecipeImageRequest,
  signal?: AbortSignal
): Promise<Blob> {
  const res = await fetch(`/api/recipes/${recipeId}/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  if (!res.ok) throw new Error(`레시피 이미지 요청 실패: ${res.status}`);
  return res.blob();
}

/** 파일 이름에 쓸 수 없는 문자를 바꾼다 */
export function recipeImageFileName(name: string): string {
  return `${SITE.name}-${name}.png`.replace(/[\\/:*?"<>|]/g, '-');
}

const isDomError = (error: unknown, name: string) => error instanceof DOMException && error.name === name;

/**
 * 아이폰, 아이패드인지. iOS는 내려받은 이미지를 사진 앱이 아니라 파일 앱에 두므로, 사진 앱에 저장하려면
 * 공유 시트의 "이미지 저장"을 거쳐야 한다. 안드로이드와 PC는 바로 내려받는 편이 빠르다.
 * 아이패드는 맥으로 알리므로 터치되는 맥도 아이패드로 본다
 */
const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

/**
 * 아이폰, 아이패드에서 파일 공유를 지원하면 공유 시트를 열고, 아니면 내려받는다.
 * 사용자가 공유 시트를 닫으면(AbortError) 조용히 끝낸다. 서버 응답을 기다리는 사이 사용자 동작으로 인정받는 시간이
 * 지나 공유가 막히면(NotAllowedError) 내려받기로 넘어간다.
 */
export async function saveImage(blob: Blob, fileName: string): Promise<void> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (isAppleMobile() && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      if (isDomError(error, 'AbortError')) return;
      if (!isDomError(error, 'NotAllowedError')) throw error;
    }
  }
  download(file);
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  // 바로 해제하면 일부 브라우저가 내려받기를 시작하기 전에 주소를 잃는다
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
