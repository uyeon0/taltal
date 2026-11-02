import { NextResponse, type NextRequest } from 'next/server';
// 묶음(@/shared/config)을 거치면 화면 문구까지 proxy에 딸려 오므로 쿠키 설정만 가져온다
import { VISIT_COOKIE } from '@/shared/config/visit';

// 첫 방문이면 시작 홈 대신 소개로 보낸다. 서버가 화면을 보내기 전에 정하므로 화면이 잠깐 보였다 바뀌지 않는다.
export function proxy(request: NextRequest) {
  if (request.cookies.has(VISIT_COOKIE.name)) return NextResponse.next();
  // 모집 글 링크의 추적 쿼리 같은 값을 잃지 않게 쿼리는 그대로 넘긴다
  const intro = request.nextUrl.clone();
  intro.pathname = '/intro';
  return NextResponse.redirect(intro);
}

export const config = {
  matcher: '/'
};
