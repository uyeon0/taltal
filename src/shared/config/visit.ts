/** 방문 쿠키. 3일 안에 다시 오면 소개를 건너뛴다(docs/overview.md "화면 사이의 상태") */
export const VISIT_COOKIE = {
  name: 'visited',
  maxAgeSeconds: 3 * 24 * 60 * 60
} as const;
