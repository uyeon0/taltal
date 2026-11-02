import { copy } from '@/shared/copy';

/** 브라우저 탭, 공유 미리보기, 머리글에 쓰는 서비스 이름과 한 줄 설명 */
export const SITE = {
  name: copy.service.name,
  description: copy.intro.description,
  /** 레시피 이미지 맺음에 쓰는 서비스 주소. 도메인을 정하기 전이라 비워 두고, 비어 있으면 이름만 쓴다 */
  url: null as string | null
} as const;
