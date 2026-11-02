'use client';

import type { ReactNode } from 'react';
import { useAppHistoryTracker } from '@/shared/lib/app-history';

function AppHistoryTracker() {
  useAppHistoryTracker();
  return null;
}

/**
 * 앱 전체에 한 번만 다는 것을 모은다. 지금은 뒤로가기 버튼이 쓰는 앱 안 기록 세기다.
 * 입력 상태는 build-inventory의 zustand 스토어라 공급자가 필요 없다.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHistoryTracker />
      {children}
    </>
  );
}
