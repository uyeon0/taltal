'use client';

import { useEffect, useState } from 'react';
import { LOADING_PHRASE_INTERVAL_MS } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { useMounted } from '@/shared/lib/use-mounted';
import { Spinner } from './spinner';

type LoadingStatusProps = {
  /** 돌아가며 보여 줄 문구. 재료명이 들어갈 수 있어 SUIT로 쓴다 */
  phrases: readonly string[];
  /** 화면 읽기 프로그램에 한 번만 전달하는 고정 안내 */
  announcement: string;
  className?: string;
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 화면 로딩. 스피너와 1.2초마다 바뀌는 문구를 보여 준다. 동작 줄이기에서는 스피너가 멈추고 첫 문구를 유지한다.
 * 최소 표시 시간은 요청 쪽에서 withMinDuration으로 맞춘다.
 */
export function LoadingStatus({ phrases, announcement, className }: LoadingStatusProps) {
  const [index, setIndex] = useState(0);
  const mounted = useMounted();

  useEffect(() => {
    if (phrases.length < 2 || prefersReducedMotion()) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % phrases.length), LOADING_PHRASE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
      {/* 처음부터 글자를 담은 live region은 읽히지 않을 수 있어 마운트 뒤에 채운다 */}
      <span role="status" className="sr-only">
        {mounted ? announcement : null}
      </span>
      <Spinner className="size-8" />
      {/* 바뀌는 문구는 화면 읽기에서 숨긴다. 매번 읽으면 같은 안내가 쌓인다 */}
      <p aria-hidden="true" className="font-sans text-base font-medium">
        {phrases[index % phrases.length]}
      </p>
    </div>
  );
}
