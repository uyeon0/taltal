'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { BRAND } from '@/shared/assets';
import { IS_AIT, SITE } from '@/shared/config';
import { copy } from '@/shared/copy';
import { canGoBackInApp } from '@/shared/lib/app-history';
import { cn } from '@/shared/lib/cn';
import { BACK_BUTTON_ATTR } from '@/shared/lib/use-sheet-route';
import { Button } from './button';

type AppHeaderProps = {
  /** 뒤로가기 버튼을 둘 때, 앱 안의 이전 기록이 없으면 갈 주소 */
  backHref?: string;
  className?: string;
};

/**
 * 헤더. 로고는 BRAND 한 곳에서 불러오고, 로고 파일이 없으면 서비스 이름을 글자로 보여 준다.
 * 앱인토스 미니앱에서는 여백만 남기고 그리지 않는다. 토스 내비게이션 바가 뒤로가기와 앱 이름을 맡는다.
 */
export function AppHeader({ backHref, className }: AppHeaderProps) {
  const router = useRouter();
  // 헤더 자리에 여백만 남겨, 내용이 토스 내비게이션 바에 바로 붙지 않게 한다
  if (IS_AIT) return <div aria-hidden data-slot="app-header-spacer" className="h-(--page-gutter)" />;

  const goBack = () => {
    if (canGoBackInApp()) router.back();
    else if (backHref) router.push(backHref);
  };

  return (
    <header className={cn('grid min-h-(--control-height) grid-cols-3 items-center px-(--page-gutter) py-2', className)}>
      <div>
        {backHref ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy.common.back}
            onClick={goBack}
            {...{ [BACK_BUTTON_ATTR]: '' }}
          >
            <ChevronLeft />
          </Button>
        ) : null}
      </div>
      <div className="flex justify-center">
        {BRAND.logo ? (
          <Image src={BRAND.logo} alt={SITE.name} width={96} height={32} unoptimized priority />
        ) : (
          <span className="font-display text-xl">{SITE.name}</span>
        )}
      </div>
    </header>
  );
}
