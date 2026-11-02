import * as React from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * 입력칸은 Light 면과 Ink 선이다. 오류는 Error 선으로 표시하고,
 * 쓰는 쪽이 aria-invalid와 aria-describedby로 오류 설명을 연결한다.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-(--control-height) w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground transition-colors placeholder:text-(--text-muted) disabled:cursor-not-allowed disabled:border-(--disabled-border) disabled:bg-(--disabled-background) disabled:text-(--disabled-foreground) aria-invalid:border-error',
        className
      )}
      {...props}
    />
  );
}

export { Input };
