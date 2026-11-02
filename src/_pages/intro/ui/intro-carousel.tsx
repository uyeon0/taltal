'use client';

import { copy } from '@/shared/copy';
import type { MascotPose } from '@/shared/assets';
import { Card } from '@/shared/ui/card';
import { Carousel } from '@/shared/ui/carousel';
import { Mascot } from '@/shared/ui/mascot';

// 장마다 그 단계의 결과 화면을 줄여 보여 줄 영역(data-slot="intro-preview")이 있다.
// 화면 모형은 각 화면(재료 입력, 추천 결과, 사용량)을 만들 때 그 작업이 이 영역에 채운다.
const SLIDES: { pose: MascotPose }[] = [{ pose: 'discovery' }, { pose: 'thinking' }, { pose: 'meal' }];

/** 소개의 세 장. 넘기기, 점 표시, 화살표는 공통 캐러셀이 맡는다 */
export function IntroCarousel() {
  return (
    <Carousel
      label={copy.intro.carouselLabel}
      className="aspect-3/2"
      arrowAnchor='[data-slot="intro-preview"]'
      slideClassName="relative flex h-full basis-full flex-col items-center gap-3 overflow-x-clip overflow-y-auto px-(--page-gutter) py-3 pointer-fine:px-12"
      slides={SLIDES.map(({ pose }, index) => ({
        key: pose,
        content: (
          <>
            {/*<p className="text-sm font-semibold">{copy.intro.stepLabel(index + 1)}</p>*/}
            <h2 className="text-center font-display text-2xl">{copy.intro.steps[index]}</h2>
            <div className="relative min-h-0 w-full flex-1">
              <Card data-slot="intro-preview" aria-hidden className="surface-default h-full" />
              {/* 영역의 오른쪽 아래 모서리에 걸친다. 그림의 투명 여백만 슬라이드 밖으로 나가서 꼬리와 몸이 잘리지 않는다 */}
              <Mascot pose={pose} size={120} className="absolute -right-12 -bottom-3 -scale-x-100" />
            </div>
          </>
        )
      }))}
    />
  );
}
