'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { useVisualViewport } from '@/shared/lib/use-visual-viewport';
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

const NON_TEXT_INPUTS = new Set(['button', 'checkbox', 'radio', 'range', 'color', 'file', 'submit', 'reset', 'image']);

/** 가상 키보드를 여는 입력칸인지 */
function opensKeyboard(target: EventTarget): boolean {
  if (target instanceof HTMLTextAreaElement) return true;
  return target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type);
}

/**
 * 재료 선택, 사용량, 레시피 상세가 함께 쓰는 바텀시트. 열고 닫는 상태는 useSheetRoute가 주소 쿼리로 갖는다.
 * 닫은 뒤 포커스는 useSheetRoute가 돌려주므로 Radix의 기본 복귀는 끈다.
 */
function BottomSheet({ open, onOpenChange, title, description, footer, children, className }: BottomSheetProps) {
  // 시트 안 입력칸에 포커스가 있는지. 그동안은 가상 키보드 위의 보이는 높이를 모두 쓴다
  const [typing, setTyping] = React.useState(false);
  const viewport = useVisualViewport(open);

  return (
    // vaul은 기본으로 열 때 포커스를 옮기지 않는다. 키보드 사용자가 시트 안에서 시작하도록 켠다.
    // vaul의 키보드 대응(repositionInputs)은 시트 위쪽 여백을 남긴 채 높이만 줄여 본문이 거의 보이지 않으므로 끄고 직접 맞춘다
    <Drawer open={open} onOpenChange={onOpenChange} autoFocus repositionInputs={false}>
      <DrawerContent
        className={cn(
          // 키보드가 가린 만큼 위로 올리고, 입력 중에는 보이는 높이까지 늘린다
          'bottom-(--sheet-keyboard-inset)',
          typing && 'max-h-(--sheet-visible-height)',
          className
        )}
        style={
          {
            '--sheet-keyboard-inset': `${viewport?.bottomInset ?? 0}px`,
            '--sheet-visible-height': viewport ? `${viewport.height}px` : '100dvh'
          } as React.CSSProperties
        }
        onFocus={(event) => {
          if (opensKeyboard(event.target)) setTyping(true);
        }}
        onBlur={(event) => {
          if (opensKeyboard(event.target)) setTyping(false);
        }}
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
