import { MissingAppDataError } from '@/shared/db';

/** 처리 중 오류를 서버 로그에 남기고 500 응답으로 바꾼다 */
export function serverError(error: unknown): Response {
  console.error(error);
  const message = error instanceof MissingAppDataError ? '앱 데이터가 없습니다.' : '서버 오류가 발생했습니다.';
  return Response.json({ error: message }, { status: 500 });
}
