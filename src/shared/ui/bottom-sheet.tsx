'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { copy } from '@/shared/copy';
import { Button } from './button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from './drawer';

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 시트 아래에 고정하는 주 행동. 가상 키보드가 열려도 보이게 본문 스크롤 밖에 둔다 */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * 재료 선택, 사용량, 레시피 상세가 함께 쓰는 바텀시트. 열고 닫는 상태는 useSheetRoute가 주소 쿼리로 갖는다.
 * 닫은 뒤 포커스는 useSheetRoute가 돌려주므로 Radix의 기본 복귀는 끈다.
 */
function BottomSheet({ open, onOpenChange, title, description, footer, children, className }: BottomSheetProps) {
  return (
    // vaul은 기본으로 열 때 포커스를 옮기지 않는다. 키보드 사용자가 시트 안에서 시작하도록 켠다
    <Drawer open={open} onOpenChange={onOpenChange} autoFocus>
      <DrawerContent
        className={className}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // 설명이 없으면 Radix가 aria-describedby 경고를 내지 않게 연결을 끊는다
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <div className="flex items-start gap-2 px-(--sheet-padding) pt-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1 py-2">
            <DrawerTitle>{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label={copy.common.closeSheet}>
              <X />
            </Button>
          </DrawerClose>
        </div>
        {/* 시트 안의 스크롤이 본문으로 넘어가지 않게 막는다 */}
        <div
          data-slot="bottom-sheet-body"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-(--sheet-padding) pb-(--sheet-padding)"
        >
          {children}
        </div>
        {footer ? (
          <div data-slot="bottom-sheet-footer" className="border-t border-foreground px-(--sheet-padding) py-3">
            {footer}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

export { BottomSheet };
