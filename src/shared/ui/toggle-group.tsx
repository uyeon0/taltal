'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import { cn } from '@/shared/lib/cn';
import { toggleVariants } from './toggle';

function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  );
}

/** 고르면 체크가 함께 보인다. 색만으로 선택을 알리지 않는다 */
function ToggleGroupItem({ className, children, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item data-slot="toggle-group-item" className={cn(toggleVariants(), className)} {...props}>
      <Check aria-hidden="true" className="hidden group-aria-checked/toggle:block group-aria-pressed/toggle:block" />
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
