/** Microsoft Clarity 프로젝트 ID. 빌드할 때 들어가고, 없으면 스크립트를 불러오지 않는다 */
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || null;

/** 앱인토스 미니앱 빌드인지. 빌드할 때 NEXT_PUBLIC_BUILD_TARGET=ait로 정한다(docs/specs/apps-in-toss.md) */
export const IS_AIT = process.env.NEXT_PUBLIC_BUILD_TARGET === 'ait';

/** 미니앱이 API를 부르는 서버. 웹은 같은 출처를 쓴다 */
const API_ORIGIN = 'https://taltal.vercel.app';

/** API 주소. path는 /api/로 시작한다. 미니앱은 정적 파일만 있어 웹 서버의 API를 부른다 */
export const apiUrl = (path: `/api/${string}`) => (IS_AIT ? `${API_ORIGIN}${path}` : path);
