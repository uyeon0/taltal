'use client';

import * as React from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useMounted } from '@/shared/lib/use-mounted';

type Tone = 'success' | 'warning' | 'error' | 'info';

// 상태색은 아이콘과 왼쪽 강조선에만 쓴다. 바탕은 Light, 글자와 외곽선은 Ink다(docs/design.md "상태색")
const TONES: Record<Tone, { icon: LucideIcon; accent: string; iconColor: string }> = {
  success: { icon: CircleCheck, accent: 'border-l-success', iconColor: 'text-success' },
  warning: { icon: TriangleAlert, accent: 'border-l-warning', iconColor: 'text-warning' },
  error: { icon: CircleAlert, accent: 'border-l-error', iconColor: 'text-error' },
  info: { icon: Info, accent: 'border-l-info', iconColor: 'text-info' }
};

type StatusMessageProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  tone: Tone;
  title: string;
  description?: string;
  /** 복구 버튼 자리. 안 되는 일은 이유와 다음 행동을 함께 보여 준다 */
  actions?: React.ReactNode;
};

/**
 * 오류와 안내를 같은 형식으로 보여 준다.
 * 화면 읽기에는 마운트 뒤에 채우는 live region으로 제목과 설명을 한 번 전달하고, 보이는 글자는 중복되지 않게 숨긴다.
 */
function StatusMessage({ tone, title, description, actions, className, ...props }: StatusMessageProps) {
  const { icon: Icon, accent, iconColor } = TONES[tone];
  const mounted = useMounted();

  return (
    <div
      data-slot="status-message"
      className={cn(
        'flex gap-3 rounded-xl border border-l-(length:--border-width-strong) border-foreground bg-card p-(--card-padding) text-foreground',
        accent,
        className
      )}
      {...props}
    >
      <span role={tone === 'error' ? 'alert' : 'status'} className="sr-only">
        {mounted ? [title, description].filter(Boolean).join(' ') : null}
      </span>
      <Icon aria-hidden="true" className={cn('size-6 shrink-0', iconColor)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p aria-hidden="true" className="font-semibold">
          {title}
        </p>
        {description ? <p aria-hidden="true">{description}</p> : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export { StatusMessage };
