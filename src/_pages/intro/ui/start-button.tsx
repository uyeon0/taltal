'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { markVisited } from '@/shared/lib/visit';
import { Button } from '@/shared/ui/button';

/**
 * 방문을 기록한 뒤 시작 홈으로 간다. 미니앱은 기록이 끝나기 전에 옮기면 시작 홈이 다시 소개로 보내므로 기다린다.
 * 기록에 실패해도 시작 홈으로 간다. Link로 만들지 않는다:
 * 쿠키를 쓰기 전에 프리페치한 / 의 리다이렉트 응답이 남아 소개로 되돌아올 수 있다.
 * replace라서 소개는 기록에 남지 않는다.
 */
export function StartButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const start = async () => {
    await markVisited().catch(() => {});
    router.replace('/');
  };

  return (
    <Button size="primary" className="w-full justify-between" onClick={start}>
      {children}
      <ArrowRight aria-hidden />
    </Button>
  );
}
