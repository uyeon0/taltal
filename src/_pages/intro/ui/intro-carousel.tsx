'use client';

import type { ComponentType } from 'react';
import { copy } from '@/shared/copy';
import { Carousel } from '@/shared/ui/carousel';
import { IngredientsPreview, MealsPreview, UsagePreview } from './intro-previews';

// 장마다 그 단계 화면의 모형(data-slot="intro-preview")을 둔다. 캐러셀 화살표가 이 자리를 기준으로 놓인다
const PREVIEWS: ComponentType[] = [IngredientsPreview, MealsPreview, UsagePreview];

/** 소개의 세 장. 넘기기, 점 표시, 화살표는 공통 캐러셀이 맡는다 */
export function IntroCarousel() {
  return (
    <Carousel
      label={copy.intro.carouselLabel}
      className="aspect-3/2"
      arrowAnchor='[data-slot="intro-preview"]'
      slideClassName="relative flex h-full basis-full flex-col items-center gap-3 overflow-x-clip overflow-y-auto px-(--page-gutter) py-3 pointer-fine:px-12"
      slides={PREVIEWS.map((Preview, index) => ({
        key: copy.intro.steps[index],
        content: (
          <>
            <h2 className="text-center font-display text-2xl">{copy.intro.steps[index]}</h2>
            {/* 장의 문구가 뜻을 전하므로 모형은 화면 읽기에서 숨긴다 */}
            <div data-slot="intro-preview" aria-hidden className="min-h-0 w-full flex-1">
              <Preview />
            </div>
          </>
        )
      }))}
    />
  );
}
