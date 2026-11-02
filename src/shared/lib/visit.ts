import { VISIT_COOKIE } from '@/shared/config';

/** 방문 쿠키를 쓴다. 다음 요청부터 루트 proxy.ts가 / 에서 소개로 보내지 않는다 */
export function markVisited() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${VISIT_COOKIE.name}=1; Max-Age=${VISIT_COOKIE.maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}
