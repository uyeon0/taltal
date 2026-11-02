'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// 이 앱 안에서 쌓은 화면 기록의 깊이. 0이면 이전 기록이 앱 밖이거나 없어서 history.back()을 쓰면 앱을 나간다.
// 시트는 쿼리만 바꾸므로 세지 않는다.
let depth = 0;
let poppedTo: string | null = null;

export function canGoBackInApp(): boolean {
  return depth > 0;
}

/** 화면 이동을 세는 훅. 앱 전체에서 한 번만 단다 */
export function useAppHistoryTracker() {
  const pathname = usePathname();
  const firstRef = useRef(true);

  useEffect(() => {
    const onPopState = () => {
      poppedTo = window.location.pathname;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    // 뒤로가기로 온 화면이면 하나 줄이고, 링크나 router로 온 화면이면 하나 늘린다
    if (poppedTo === pathname) depth = Math.max(0, depth - 1);
    else depth += 1;
    poppedTo = null;
  }, [pathname]);
}
