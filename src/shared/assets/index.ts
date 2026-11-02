// public/에 둔 도메인과 무관한 이미지의 경로. 재료 그림 경로는 entities/ingredient에 있다.

/** 다람쥐 포즈. 식별자와 쓰는 곳은 docs/design.md의 "다람쥐" 표를 따른다 */
export const MASCOT_IMAGES = {
  default: '/images/mascot/default.png',
  discovery: '/images/mascot/discovery.png',
  thinking: '/images/mascot/thinking.png',
  meal: '/images/mascot/meal.png',
  retry: '/images/mascot/retry.png'
} as const;
export type MascotPose = keyof typeof MASCOT_IMAGES;

/**
 * 머리글 로고와 파비콘. 모든 화면이 여기서 불러온다.
 * 로고 파일이 오면 public/brand/에 넣고 logo를 채운다. null이면 머리글이 서비스 이름을 글자로 보여 준다.
 */
export const BRAND: { logo: string | null; favicon: string; appleIcon: string } = {
  logo: null,
  favicon: '/brand/favicon.png',
  appleIcon: '/brand/apple-icon.png'
};
