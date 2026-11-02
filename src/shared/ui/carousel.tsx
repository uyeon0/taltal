'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

type CarouselProps = {
  label: string;
  slides: { key: string; content: React.ReactNode }[];
  /**
   * 점 표시와 화살표를 둔다. false면 모든 장을 화면 읽기에 남기고, 장에 포커스가 오면 그 장으로 넘긴다.
   * 이때 장 사이 16px과 포커스 외곽선은 캐러셀이 맡는다. 내용은 장 높이에 맞춰 늘어난다
   */
  controls?: boolean;
  /** 화살표를 세로 중앙에 맞출 요소의 선택자. 장마다 하나다. 없으면 영역 세로 중앙이다 */
  arrowAnchor?: string;
  /** center면 첫 장과 마지막 장도 가운데에 둔다 */
  align?: 'start' | 'center';
  className?: string;
  slideClassName?: string;
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 장을 옆으로 넘긴다. 점 표시는 어느 환경에서나, 화살표는 마우스 환경에서만 보인다 */
export function Carousel({
  label,
  slides,
  controls = true,
  arrowAnchor,
  align = 'start',
  className,
  slideClassName
}: CarouselProps) {
  // 가운데 정렬에서는 양 끝 장도 가운데에 오도록 끝을 자르지 않는다
  const [viewportRef, embla] = useEmblaCarousel({
    loop: false,
    align,
    containScroll: align === 'start' && 'trimSnaps'
  });
  const [selected, setSelected] = useState(0);
  const regionRef = useRef<HTMLDivElement>(null);
  // 화살표를 보이는 장의 기준 요소 세로 중앙에 맞춘다. 문구 줄 수에 따라 요소의 위치가 장마다 달라서 직접 잰다
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
    const anchor = arrowAnchor && region?.querySelectorAll<HTMLElement>(arrowAnchor)[selected];
    if (!controls || !region || !anchor) return;
    const measure = () => {
      const regionRect = region.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      setArrowTop(anchorRect.top - regionRect.top + anchorRect.height / 2);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [selected, controls, arrowAnchor]);

  // 동작 줄이기에서는 움직임 없이 바로 바꾼다
  const scrollTo = useCallback((index: number) => embla?.scrollTo(index, prefersReducedMotion()), [embla]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={regionRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        className={cn('relative w-full', className)}
      >
        <div ref={viewportRef} className="h-full overflow-hidden">
          <div className="flex h-full">
            {slides.map(({ key, content }, index) => (
              <div
                key={key}
                role="group"
                aria-roledescription="slide"
                aria-label={copy.common.slideLabel(index + 1, slides.length)}
                aria-hidden={controls ? selected !== index : undefined}
                inert={controls ? selected !== index : undefined}
                // 조작 버튼이 없으면 키보드로 장에 포커스를 옮겨 넘긴다
                tabIndex={controls ? undefined : 0}
                onFocus={controls ? undefined : () => scrollTo(index)}
                className={cn(
                  'min-w-0 shrink-0 grow-0',
                  // 외곽선을 장에 그리면 viewport의 overflow-hidden에 잘린다. 장 안쪽 여백에 감싼 요소의 외곽선 자리를 둔다
                  !controls && 'group flex px-2 py-2 focus-visible:outline-none',
                  slideClassName
                )}
              >
                {controls ? (
                  content
                ) : (
                  // 카드 라운딩(12px)에 맞춰 외곽선이 내용의 모서리를 따라가게 한다
                  <div className="flex w-full rounded-xl outline-offset-(--focus-ring-offset) outline-ring group-focus-visible:outline-(length:--focus-ring-width) group-focus-visible:outline-solid [&>*]:w-full">
                    {content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {controls && (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={copy.common.prev}
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
              aria-label={copy.common.next}
              onClick={() => embla?.scrollNext(prefersReducedMotion())}
              style={arrowTop === null ? undefined : { top: arrowTop }}
              className={cn(
                'absolute top-1/2 right-0 z-10 hidden -translate-y-1/2 pointer-fine:inline-flex',
                selected === slides.length - 1 && 'pointer-fine:invisible'
              )}
            >
              <ArrowRight />
            </Button>
          </>
        )}
      </div>

      {controls && (
        <div className="flex">
          {slides.map(({ key }, index) => (
            <button
              key={key}
              type="button"
              aria-label={copy.common.goToSlide(index + 1)}
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
      )}
    </div>
  );
}
