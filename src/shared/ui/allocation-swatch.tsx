import { cn } from '@/shared/lib/cn';

// Tailwind가 클래스 이름을 찾을 수 있게 그대로 적는다. 색은 순서(1부터)에 붙는다(docs/design.md "재료 배분 표현")
const ALLOCATION_BACKGROUNDS = [
  'bg-allocation-1',
  'bg-allocation-2',
  'bg-allocation-3',
  'bg-allocation-4',
  'bg-allocation-5'
] as const;

/** 순서(1부터)의 배분색 배경 클래스. 색이 모자라면 처음부터 다시 쓴다 */
export function allocationBackground(order: number): string {
  const count = ALLOCATION_BACKGROUNDS.length;
  return ALLOCATION_BACKGROUNDS[(((order - 1) % count) + count) % count];
}

type AllocationSwatchProps = {
  order: number;
  className?: string;
};

/** 배분색 표식. 색만으로 뜻을 전하지 않으므로 옆에 번호와 이름을 함께 쓴다 */
export function AllocationSwatch({ order, className }: AllocationSwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-4 shrink-0 rounded-full border border-foreground',
        allocationBackground(order),
        className
      )}
    />
  );
}
