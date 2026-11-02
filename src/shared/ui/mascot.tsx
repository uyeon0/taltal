import Image from 'next/image';
import { MASCOT_IMAGES, type MascotPose } from '@/shared/assets';
import { cn } from '@/shared/lib/cn';

type MascotProps = {
  pose: MascotPose;
  /** 화면에 보일 크기(px). 가로세로가 같다 */
  size: number;
  /** 안내 글이 같은 뜻을 전달하면 비워 둔다 */
  alt?: string;
  priority?: boolean;
  className?: string;
};

/** 다람쥐. 종횡비를 유지하고 꼬리, 손, 접시를 자르지 않는다(docs/design.md "다람쥐") */
export function Mascot({ pose, size, alt = '', priority = false, className }: MascotProps) {
  return (
    <Image
      src={MASCOT_IMAGES[pose]}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={cn('shrink-0 object-contain', className)}
    />
  );
}
