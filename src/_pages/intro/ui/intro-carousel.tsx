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
      arrowAnchor='[data-slot="intro-preview"]'
      slideClassName="relative flex basis-full flex-col items-center gap-3 overflow-x-clip overflow-y-auto px-(--page-gutter) py-3 pointer-fine:px-12"
      slides={PREVIEWS.map((Preview, index) => ({
        key: copy.intro.steps[index],
        content: (
          <>
            {/* 장 제목은 줄을 바꾸지 않는다. 가장 긴 제목이 360px 화면 한 줄에 들어가게 화면 폭에 따라 줄인다 */}
            <h2 className="text-center font-display text-(length:--intro-step-title-size) whitespace-nowrap">
              {copy.intro.steps[index]}
            </h2>
            {/* 장의 문구가 뜻을 전하므로 모형은 화면 읽기에서 숨긴다.
                영역이 장 제목 아래 남는 공간을 채우고 모형을 세로 가운데에 둔다. 화살표도 이 영역의 세로 가운데에 놓여 모형과 맞는다 */}
            <div data-slot="intro-preview" aria-hidden className="flex min-h-0 w-full flex-1 flex-col">
              <Preview />
            </div>
          </>
        )
      }))}
    />
  );
}
