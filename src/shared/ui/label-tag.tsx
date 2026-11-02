import * as React from 'react';
import { cn } from '@/shared/lib/cn';

// 라벨 태그는 Ink 면, Light 글자, 선 없는 알약이다. 누를 수 없는 표시라 hover, pressed 모습이 없다.
// 선이 없고 높이가 낮아서 3px 선, 44px 높이의 선택 칩과 모양으로 구분된다(docs/design.md "공간과 형태")
function LabelTag({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="label-tag"
      className={cn(
        'inline-flex shrink-0 items-center rounded-pill bg-(--neutral-ink) px-3 py-1 text-xs font-bold text-(--neutral-light)',
        className
      )}
      {...props}
    />
  );
}

export { LabelTag };
