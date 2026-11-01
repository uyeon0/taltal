'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { INGREDIENT_FALLBACK_IMAGE, INGREDIENT_IMAGES } from '../model/ingredient-images';

/** 재료 ID로 그림 경로를 찾는다. 그림이 없는 재료와 나중에 추가되는 재료는 공통 대체 그림을 쓴다 */
export function ingredientImageSrc(ingredientId: string): string {
  return INGREDIENT_IMAGES[ingredientId] ?? INGREDIENT_FALLBACK_IMAGE;
}

type IngredientImageProps = {
  ingredientId: string;
  /** 화면에 보일 크기(px). 가로세로가 같다 */
  size: number;
  className?: string;
};

/**
 * 재료 그림. 옆에 재료 이름이 있으므로 대체 텍스트는 비운다.
 * 불러오지 못하면 대체 그림으로 바꾼다.
 */
export function IngredientImage({ ingredientId, size, className }: IngredientImageProps) {
  const src = ingredientImageSrc(ingredientId);
  // 실패한 경로를 기억한다. 재료가 바뀌면 새 경로로 다시 시도한다
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shownSrc = failedSrc === src ? INGREDIENT_FALLBACK_IMAGE : src;

  return (
    <Image
      src={shownSrc}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn('shrink-0 object-contain', className)}
      onError={() => {
        if (shownSrc !== INGREDIENT_FALLBACK_IMAGE) setFailedSrc(src);
      }}
    />
  );
}
