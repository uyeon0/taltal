'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/shared/lib/cn';

// vaul 바텀시트의 바탕. 화면에서는 BottomSheet를 쓴다

function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

// 시트 뒤는 Ink 50% 막으로 덮는다. 흐림 효과는 쓰지 않는다
function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn('app-sheet-overlay fixed inset-0 z-50 bg-scrim', className)}
      {...props}
    />
  );
}

// 앱 열과 같은 폭으로 가운데에 둔다. 위쪽 라운딩 20px, 기본 굵기 Ink 선
function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'app-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-9/10 w-full max-w-(--app-max-width) flex-col rounded-t-2xl border border-b-0 border-foreground bg-popover text-popover-foreground',
          className
        )}
        {...props}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('font-heading text-xl font-bold text-foreground', className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

export { Drawer, DrawerPortal, DrawerOverlay, DrawerClose, DrawerContent, DrawerTitle, DrawerDescription };
