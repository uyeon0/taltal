import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/shared/lib/cn';
import { Spinner } from './spinner';

const disabledLook =
  'disabled:border-(--disabled-border) disabled:bg-(--disabled-background) disabled:text-(--disabled-foreground)';
const blueReaction =
  'hover:bg-action-hover hover:text-action-on-hover active:bg-action-hover active:text-action-on-hover';

// 기준은 docs/design.md의 "버튼"과 "컴포넌트 상태"다. 주황 면 안에서는 토큰이 바뀌어 주요 버튼이 먹색으로 반전된다
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border text-base font-semibold transition-colors select-none disabled:cursor-not-allowed aria-disabled:cursor-not-allowed data-loading:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: cn('border-foreground bg-primary text-primary-foreground', blueReaction, disabledLook),
        secondary: cn('border-foreground bg-secondary text-secondary-foreground', blueReaction, disabledLook),
        // 가장 낮은 행동. 아이콘을 빼지 않는다. 밝은 면에서는 블루, 주황 면에서는 밑줄로 반응한다
        ghost: cn(
          'border-transparent bg-transparent text-foreground hover:text-action-hover active:text-action-hover',
          'on-brand:hover:text-foreground on-brand:hover:underline on-brand:active:text-foreground on-brand:active:underline',
          'disabled:text-(--disabled-foreground)'
        )
      },
      size: {
        default: 'min-h-(--control-height) px-4 py-2',
        primary: 'min-h-(--control-height-primary) px-4 py-2',
        icon: 'size-(--control-height)'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default'
    }
  }
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** 폭을 유지한 채 스피너를 보여 주고 다시 누를 수 없게 한다. 비활성 모습으로 바꾸지 않는다 */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      {...props}
      data-slot="button"
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || props['aria-disabled']}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        // 키보드로 누르면 pointer-events로 막히지 않으므로 여기서 한 번 더 막는다
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Spinner /> : null}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
