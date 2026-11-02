'use client';

import * as React from 'react';
import { Separator as SeparatorPrimitive } from 'radix-ui';
import { cn } from '@/shared/lib/cn';

/** 장식 구분선. 1px Subtle이고, 입력이나 선택을 표시하는 데 쓰지 않는다 */
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border data-horizontal:h-(--border-width-divider) data-horizontal:w-full data-vertical:w-(--border-width-divider) data-vertical:self-stretch',
        className
      )}
      {...props}
    />
  );
}

export { Separator };
