// 앱인토스 미니앱이 다른 출처에서 API를 부를 수 있게 CORS 헤더를 붙인다(docs/specs/apps-in-toss.md).
// 웹은 같은 출처라 CORS 헤더가 필요 없다. 허용하지 않은 출처에는 헤더를 붙이지 않아 브라우저가 응답을 막는다.

/** 미니앱 운영 주소와 QR 테스트 주소. appName은 apps-in-toss.config.ts와 같다 */
const ALLOWED_ORIGINS = new Set(['https://taltal.apps.tossmini.com', 'https://taltal.private-apps.tossmini.com']);

type Handler<Args extends unknown[]> = (request: Request, ...args: Args) => Promise<Response>;

function setCorsHeaders(request: Request, headers: Headers, methods: string) {
  // 출처마다 응답이 달라지므로 캐시가 출처를 구분하게 한다
  headers.append('Vary', 'Origin');
  const origin = request.headers.get('Origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return;
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', `${methods}, OPTIONS`);
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
}

/** 처리 함수의 모든 응답(성공, 4xx, 5xx)에 CORS 헤더를 붙인다. 오류 응답에 없으면 브라우저가 오류 내용을 읽지 못한다 */
export function withCors<Args extends unknown[]>(methods: string, handler: Handler<Args>): Handler<Args> {
  return async (request, ...args) => {
    const response = await handler(request, ...args);
    setCorsHeaders(request, response.headers, methods);
    return response;
  };
}

/** 사전 요청(OPTIONS)에 답한다. JSON 본문을 보내는 POST는 브라우저가 먼저 사전 요청을 보낸다 */
export function preflight(methods: string) {
  return async (request: Request) => {
    const headers = new Headers();
    setCorsHeaders(request, headers, methods);
    return new Response(null, { status: 204, headers });
  };
}
