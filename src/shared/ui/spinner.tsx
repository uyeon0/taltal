import { LoaderCircle } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/** 도는 표시. 동작 줄이기에서는 멈춘다. 뜻은 옆 문구가 전달하므로 화면 읽기에서 숨긴다 */
export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn('size-5 shrink-0 animate-spin motion-reduce:animate-none', className)}
    />
  );
}
