import { copy } from '@/shared/copy';

/** 브라우저 탭, 공유 미리보기, 머리글에 쓰는 서비스 이름과 한 줄 설명 */
export const SITE = {
  name: copy.service.name,
  description: copy.intro.description
} as const;
