import { NextResponse, type NextRequest } from 'next/server';
import { VISIT_COOKIE } from '@/shared/config';

// 첫 방문이면 시작 홈 대신 소개로 보낸다. 서버가 화면을 보내기 전에 정하므로 화면이 잠깐 보였다 바뀌지 않는다.
export function proxy(request: NextRequest) {
  if (request.cookies.has(VISIT_COOKIE.name)) return NextResponse.next();
  return NextResponse.redirect(new URL('/intro', request.url));
}

export const config = {
  matcher: '/'
};
