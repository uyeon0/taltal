'use client';

import { useVisitGate } from '@/shared/lib/visit';

/** 미니앱에서 첫 방문이면 소개로 보낸다. 확인이 끝날 때까지 그리지 않아 시작 홈이 잠깐 보였다 바뀌지 않는다 */
export function VisitGate({ children }: { children: React.ReactNode }) {
  return useVisitGate('/intro') ? children : null;
}
