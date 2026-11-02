import * as React from 'react';
import { cn } from '@/shared/lib/cn';

// 카드는 Light 면, 기본 굵기 Ink 선, 12px 라운딩이다. 화면 배경이 주황이라 surface-default로 Light 면의 값을 되돌린다.
// 그래서 카드 안의 주요 버튼은 Primary 면이고 부가 글자는 Muted다
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'surface-default flex flex-col gap-3 rounded-xl border border-foreground bg-card p-(--card-padding) text-card-foreground',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1', className)} {...props} />;
}

// font-heading은 SUIT다. 동적 요리명이 들어가기 때문이다
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('font-heading text-xl font-bold', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-xs text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('flex flex-col gap-2', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center gap-2', className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
