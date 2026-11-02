'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import { cn } from '@/shared/lib/cn';

// 하나 고르는 항목(인분, 가짓수, 단위)은 고르면 Ink 면, Light 글자, 체크다(docs/design.md "컴포넌트 상태")
const toggleVariants = cva(
  'group/toggle inline-flex min-h-(--control-height) min-w-(--control-height) items-center justify-center gap-1 rounded-lg border border-foreground bg-card px-3 py-2 text-base font-semibold text-foreground transition-colors select-none hover:bg-action-hover hover:text-action-on-hover aria-checked:bg-(--selected-solid-background) aria-checked:text-(--selected-solid-foreground) aria-pressed:bg-(--selected-solid-background) aria-pressed:text-(--selected-solid-foreground) disabled:cursor-not-allowed disabled:border-(--disabled-border) disabled:bg-(--disabled-background) disabled:text-(--disabled-foreground) [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0'
);

function Toggle({
  className,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants(), className)} {...props} />;
}

export { Toggle, toggleVariants };
