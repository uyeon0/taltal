'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import type { MascotPose } from '@/shared/assets';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Mascot } from '@/shared/ui/mascot';

// 장마다 그 단계의 결과 화면을 줄여 보여 줄 영역(data-slot="intro-preview")이 있다.
// 화면 모형은 각 화면(재료 입력, 추천 결과, 사용량)을 만들 때 그 작업이 이 영역에 채운다.
const SLIDES: { pose: MascotPose }[] = [{ pose: 'discovery' }, { pose: 'thinking' }, { pose: 'meal' }];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 소개의 세 장을 옆으로 넘긴다. 점 표시는 어느 환경에서나, 화살표는 마우스 환경에서만 보인다 */
export function IntroCarousel() {
  const [viewportRef, embla] = useEmblaCarousel({ loop: false, align: 'start' });
  const [selected, setSelected] = useState(0);
  const regionRef = useRef<HTMLDivElement>(null);
  // 화살표를 보이는 장의 영역 세로 중앙에 맞춘다. 문구 줄 수에 따라 영역의 위치가 장마다 달라서 직접 잰다
  const [arrowTop, setArrowTop] = useState<number | null>(null);

  useEffect(() => {
    if (!embla) return;
    const sync = () => setSelected(embla.selectedScrollSnap());
    sync();
    embla.on('select', sync).on('reInit', sync);
    return () => {
      embla.off('select', sync).off('reInit', sync);
    };
  }, [embla]);

  useEffect(() => {
    const region = regionRef.current;
    const card = region?.querySelectorAll<HTMLElement>('[data-slot="intro-preview"]')[selected];
    if (!region || !card) return;
    const measure = () => {
      const regionRect = region.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      setArrowTop(cardRect.top - regionRect.top + cardRect.height / 2);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    observer.observe(card);
    return () => observer.disconnect();
  }, [selected]);

  // 동작 줄이기에서는 움직임 없이 바로 바꾼다
  const scrollTo = useCallback((index: number) => embla?.scrollTo(index, prefersReducedMotion()), [embla]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={regionRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={copy.intro.carouselLabel}
        className="relative aspect-3/2 w-full"
      >
        <div ref={viewportRef} className="h-full overflow-hidden">
          <div className="flex h-full">
            {SLIDES.map(({ pose }, index) => (
              <div
                key={pose}
                role="group"
                aria-roledescription="slide"
                aria-label={copy.intro.slideLabel(index + 1, SLIDES.length)}
                aria-hidden={selected !== index}
                inert={selected !== index}
                className="relative flex h-full min-w-0 shrink-0 grow-0 basis-full flex-col items-center gap-3 overflow-x-clip overflow-y-auto px-(--page-gutter) py-3 pointer-fine:px-12"
              >
                {/*<p className="text-sm font-semibold">{copy.intro.stepLabel(index + 1)}</p>*/}
                <h2 className="text-center font-display text-2xl">{copy.intro.steps[index]}</h2>
                <div className="relative min-h-0 w-full flex-1">
                  <Card data-slot="intro-preview" aria-hidden className="surface-default h-full" />
                  {/* 영역의 오른쪽 아래 모서리에 걸친다. 그림의 투명 여백만 슬라이드 밖으로 나가서 꼬리와 몸이 잘리지 않는다 */}
                  <Mascot pose={pose} size={120} className="absolute -right-16 -bottom-3 -scale-x-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={copy.intro.prev}
          onClick={() => embla?.scrollPrev(prefersReducedMotion())}
          style={arrowTop === null ? undefined : { top: arrowTop }}
          className={cn(
            'absolute top-1/2 left-0 z-10 hidden -translate-y-1/2 pointer-fine:inline-flex',
            selected === 0 && 'pointer-fine:invisible'
          )}
        >
          <ArrowLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={copy.intro.next}
          onClick={() => embla?.scrollNext(prefersReducedMotion())}
          style={arrowTop === null ? undefined : { top: arrowTop }}
          className={cn(
            'absolute top-1/2 right-0 z-10 hidden -translate-y-1/2 pointer-fine:inline-flex',
            selected === SLIDES.length - 1 && 'pointer-fine:invisible'
          )}
        >
          <ArrowRight />
        </Button>
      </div>

      <div className="flex">
        {SLIDES.map(({ pose }, index) => (
          <button
            key={pose}
            type="button"
            aria-label={copy.intro.goToSlide(index + 1)}
            aria-current={selected === index ? 'true' : undefined}
            onClick={() => scrollTo(index)}
            className="flex h-(--control-height) w-8 items-center justify-center"
          >
            <span
              className={cn('size-3 rounded-full border border-foreground', selected === index && 'bg-foreground')}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
