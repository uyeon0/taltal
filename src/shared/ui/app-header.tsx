'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { BRAND } from '@/shared/assets';
import { SITE } from '@/shared/config';
import { copy } from '@/shared/copy';
import { canGoBackInApp } from '@/shared/lib/app-history';
import { cn } from '@/shared/lib/cn';
import { BACK_BUTTON_ATTR } from '@/shared/lib/use-sheet-route';
import { Button } from './button';

type AppHeaderProps = {
  /** 뒤로가기 버튼을 둘 때, 앱 안의 이전 기록이 없으면 갈 주소 */
  backHref?: string;
  /** 뒤로가기 버튼에 아이콘과 함께 보일 글자. 없으면 아이콘만 두고 화면 읽기에는 "뒤로"를 전한다 */
  backLabel?: string;
  className?: string;
};

/** 머리글. 로고는 BRAND 한 곳에서 불러오고, 로고 파일이 없으면 서비스 이름을 글자로 보여 준다 */
export function AppHeader({ backHref, backLabel, className }: AppHeaderProps) {
  const router = useRouter();

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
            size={backLabel ? 'default' : 'icon'}
            aria-label={backLabel ? undefined : copy.common.back}
            onClick={goBack}
            className={backLabel ? '-ml-2 px-2' : undefined}
            {...{ [BACK_BUTTON_ATTR]: '' }}
          >
            <ChevronLeft />
            {backLabel}
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
