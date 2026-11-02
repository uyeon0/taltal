'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/shared/lib/cn';
import { toggleVariants } from './toggle';

/** 방향키, Home, End로 탭을 옮기고 탭과 패널을 aria-controls로 잇는 것은 Radix가 맡는다 */
function Tabs({ ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn('flex flex-wrap gap-2', className)} {...props} />;
}

/** 하나 고르는 항목과 같은 모습이다. 고르면 Ink 면, Light 글자, 체크다(docs/design.md "컴포넌트 상태") */
function TabsTrigger({ className, children, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        toggleVariants(),
        'aria-selected:bg-(--selected-solid-background) aria-selected:text-(--selected-solid-foreground)',
        className
      )}
      {...props}
    >
      <Check aria-hidden="true" className="hidden group-aria-selected/toggle:block" />
      {children}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
