'use client';

import { useEffect, useRef, useState } from 'react';

import { requestRecipeImage, saveImage, type RecipeImageRequest } from './save-recipe-image';

export type SaveImageStatus = 'idle' | 'saving' | 'error';

export type SaveImageTarget = { recipeId: number; fileName: string; body: RecipeImageRequest };

/**
 * 시트의 이미지 저장 상태. 받는 동안에는 다시 저장하지 않는다.
 * 시트를 닫거나 다른 요리로 바뀌면 받던 요청을 끊고 처음 상태로 돌린다.
 */
export function useSaveRecipeImage(target: SaveImageTarget | null, open: boolean) {
  const [status, setStatus] = useState<SaveImageStatus>('idle');
  const controller = useRef<AbortController | null>(null);

  const key = open ? (target?.recipeId ?? null) : null;
  const [shownKey, setShownKey] = useState(key);
  if (shownKey !== key) {
    setShownKey(key);
    setStatus('idle');
  }
  useEffect(() => () => controller.current?.abort(), [key]);

  const save = async () => {
    if (!target || status === 'saving') return;
    const current = new AbortController();
    controller.current = current;
    setStatus('saving');
    try {
      const blob = await requestRecipeImage(target.recipeId, target.body, current.signal);
      if (current.signal.aborted) return;
      setStatus('idle');
      await saveImage(blob, target.fileName);
    } catch {
      if (!current.signal.aborted) setStatus('error');
    }
  };

  return { status, save };
}
