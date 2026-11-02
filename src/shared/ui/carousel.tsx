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
  /** 화살표를 세로 중앙에 맞출 요소의 선택자. 장마다 하나다. 없으면 영역 세로 중앙이다 */
  arrowAnchor?: string;
  className?: string;
  slideClassName?: string;
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 장을 옆으로 넘긴다. 점 표시는 어느 환경에서나, 화살표는 마우스 환경에서만 보인다 */
export function Carousel({ label, slides, arrowAnchor, className, slideClassName }: CarouselProps) {
  const [viewportRef, embla] = useEmblaCarousel({ loop: false, align: 'start' });
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
    if (!region || !anchor) return;
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
  }, [selected, arrowAnchor]);

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
                aria-hidden={selected !== index}
                inert={selected !== index}
                className={cn('min-w-0 shrink-0 grow-0', slideClassName)}
              >
                {content}
              </div>
            ))}
          </div>
        </div>

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
      </div>

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
    </div>
  );
}
