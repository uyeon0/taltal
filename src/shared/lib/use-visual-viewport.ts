'use client';

import { useEffect, useState } from 'react';

export type VisualViewportSize = {
  /** 화면에 보이는 높이(px). 가상 키보드가 열리면 줄어든다 */
  height: number;
  /** 화면 아래에서 가상 키보드가 가린 높이(px). 키보드가 없으면 0이다 */
  bottomInset: number;
};

function measure(): VisualViewportSize | null {
  const viewport = window.visualViewport;
  if (!viewport) return null;
  return {
    height: viewport.height,
    bottomInset: Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
  };
}

/**
 * 보이는 화면의 높이와 가상 키보드가 가린 높이. active가 false면 재지 않는다.
 * 서버와 visualViewport가 없는 브라우저에서는 null이다.
 */
export function useVisualViewport(active: boolean): VisualViewportSize | null {
  const [size, setSize] = useState<VisualViewportSize | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) return;
    const update = () => setSize(measure());
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [active]);

  return active ? size : null;
}
