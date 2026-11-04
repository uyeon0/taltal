# 앱인토스 미니앱

같은 소스에서 웹 빌드와 앱인토스 미니앱 빌드를 따로 만든다. 미니앱 번들을 콘솔에 올려 토스 앱에서 QR로 테스트하는 데까지 한다.

- 이슈: #44 앱인토스 출시
- 기준 문서: `docs/requirements/apps-in-toss.md`, `docs/overview.md`, `docs/architecture.md`
- 참고: Next.js `node_modules/next/dist/docs/01-app/02-guides/static-exports.md`, 앱인토스 [기존 웹 프로젝트에 SDK 연동하기](https://developers-apps-in-toss.toss.im/ai-vibe-coding/tutorials/webview)
- 브랜치: `feat/apps-in-toss`

## 사용자와 정한 것

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 저장소 | 하나로 두고 빌드만 나눈다 | 화면, 문구, 도메인 로직을 함께 쓰고 API 서버도 같다 |
| 재료 목록 | 두 빌드 모두 빌드할 때 페이지에 넣는다 | 웹에서도 이미 정적 페이지로 내려가는 공개 데이터다 |
| 레시피 | 두 빌드 모두 Vercel API로 받는다 | 레시피 전체를 브라우저로 보내지 않는다 |
| 첫 방문 판단 | 웹은 `proxy.web.ts`, 미니앱은 SDK `Storage`. 둘 다 3일 | 웹 동작을 바꾸지 않는다 |
| 이미지 저장 | 미니앱은 SDK `File.saveBase64` | 웹의 공유 시트와 내려받기가 토스 WebView에서 되는지 문서에 없다 |
| `cacheComponents` | 웹과 미니앱 모두 끈다. `'use cache'`로 내던 결과(화면과 OG 이미지의 정적 생성)는 다른 방법으로 낸다 | 정적 export와 함께 켤 수 없다. 처음 프로젝트를 만들 때부터 켜져 있었고 따로 고른 설정이 아니다 |
| 결과 화면의 숨김 처리 | 지운다 | `cacheComponents`가 떠난 화면을 `<Activity>`로 숨겨 둬서 더한 처리다. 끄면 떠난 화면은 사라진다 |
| Clarity | 웹에서만 | 외부 분석 스크립트의 허용 여부가 문서에 없다 |
| 범위 | QR 테스트까지 | 검수와 출시는 다음 작업이다 |

## 시험 빌드로 확인한 것

저장소 복사본에서 아래 설정으로 두 빌드를 돌려 확인했다.

- `cacheComponents`(`'use cache'`)는 정적 export와 함께 켜지지 않는다. `Invariant: PPR cannot be enabled in export mode` 오류가 난다. `cacheComponents`를 끄면 `'use cache'`가 있는 파일에서 빌드가 멈춘다. `partialPrefetching`은 `cacheComponents` 없이 켤 수 없다.
- `'use cache'`를 빼고 `cacheComponents`, `partialPrefetching`을 끄면 웹 빌드에서도 `/`, `/intro`, `/ingredients`, `/results`가 그대로 정적(○)이다. 파일 읽기만 하고 요청 정보를 읽지 않기 때문이다.
- `pageExtensions`로 `*.web.ts(x)` 파일을 미니앱 빌드에서 뺄 수 있다. `proxy`도 `pageExtensions`를 따른다. 웹 빌드에서는 API 3개와 Proxy가 그대로 잡힌다.
- 메타데이터 이미지 파일(`opengraph-image`)에 `.web`을 붙이면 주소가 `/opengraph-image.web`으로 바뀐다. 그래서 이 파일은 이름을 두고 `dynamic = 'force-static'`을 붙여 두 빌드 모두에 넣는다.
- 미니앱 빌드에서는 API 라우트가 빠져 전역 타입 `RouteContext`가 생기지 않는다. `src/_app/api-routes`의 타입 검사가 실패한다.
- 미니앱 결과물(`out/`, 3.3MB)에 레시피 조리 과정은 없다. 레시피 이름은 시작 홈 예시 묶음에 있는 11개만 있고, 웹 페이지와 같다.

## 빌드

### `next.config.ts`

빌드 대상은 환경 변수 `NEXT_PUBLIC_BUILD_TARGET`으로 정한다. 값이 `ait`면 미니앱 빌드, 없으면 웹 빌드다. 클라이언트 코드도 같은 값으로 환경을 나누므로 `NEXT_PUBLIC_`을 붙인다.

| 설정 | 웹 | 미니앱 |
| --- | --- | --- |
| `output` | 없음 | `'export'` |
| `pageExtensions` | `['web.tsx', 'web.ts', 'tsx', 'ts']` | `['tsx', 'ts']` |
| `trailingSlash` | 없음 | `true` |
| `typescript.ignoreBuildErrors` | `false` | `true` |
| `cacheComponents`, `partialPrefetching` | 지운다 | 지운다 |
| `outputFileTracingIncludes` | 그대로 | 쓰이지 않는다 |

- `trailingSlash`는 `/ingredients`를 `ingredients/index.html`로 만든다. 토스 WebView가 `.html` 없는 주소를 어떻게 찾는지 문서에 없어서, 정적 호스팅에서 가장 널리 동작하는 모양을 고른다. QR 테스트에서 화면 이동을 확인한다.
- 미니앱 빌드의 타입 검사는 끈다. 타입은 `npm run typecheck`(웹 기준)로 검사한다. 미니앱 빌드에서만 빠지는 파일은 API 라우트와 `proxy`뿐이라 검사에서 빠지는 코드가 없다.

### 파일 이름

| 지금 | 바꾼 뒤 |
| --- | --- |
| `app/api/candidates/route.ts` | `route.web.ts` |
| `app/api/recipes/[id]/route.ts` | `route.web.ts` |
| `app/api/recipes/[id]/image/route.ts` | `route.web.ts` |
| `proxy.ts`, `proxy.test.ts` | `proxy.web.ts`, `proxy.web.test.ts` |

### 캐시

`'use cache'` 4곳을 지운다. 지운 뒤에도 데이터 파일은 요청마다 다시 읽지 않는다.

- `entities/ingredient`, `entities/recipe`의 `load*` 함수는 모듈 안의 `Promise`에 담아 처음 한 번만 읽는다. 읽기에 실패하면 담은 값을 비워 다음 요청에서 다시 읽는다.
- `_app/og-image`의 `loadAssets`는 `'use cache'`만 지운다. `app/opengraph-image.tsx`에 `export const dynamic = 'force-static'`을 더해 빌드할 때 한 번 그리므로 따로 담아 두지 않는다.
- `shared/db/read-app-json.ts`의 `'use cache'` 관련 주석을 고친다. `assertAppData`로 먼저 확인하는 순서는 그대로 둔다.

### 결과 화면

`src/_pages/results/ui/results-screen.tsx`에서 숨겨질 때 `key`를 바꾸는 처리(`useLayoutEffect` cleanup과 `visit` 상태)와 그 주석을 지운다. `cacheComponents`를 끄면 떠난 화면은 지워지고 다시 들어오면 새로 그려지므로, 계산 중부터 시작하는 동작은 그대로다. `docs/specs/results.md`의 해당 문단도 지운다.

### 스크립트

| 스크립트 | 명령 |
| --- | --- |
| `build` | `next build`. 그대로 둔다. Vercel이 쓴다 |
| `build:ait` | `NEXT_PUBLIC_BUILD_TARGET=ait next build && ait build` |
| `dev:ait` | `NEXT_PUBLIC_BUILD_TARGET=ait next dev` |

`npx ait init`이 `package.json`의 `build`를 바꾸면 위와 같이 되돌린다.

### `apps-in-toss.config.ts`

- `appName`: `taltal`. 콘솔에 등록하는 이름과 같아야 업로드할 수 있다
- `brand.primaryColor`: `#F59A4F`(`brand.primary`)
- `webBundleDir`: `out`
- `permissions`: 비운다. `File.saveBase64` 문서에 필요한 권한이 없다

`@apps-in-toss/web-framework`는 3.9.0을 설치한다. React 19와 함께 쓸 수 있는지는 설치하면서 확인하고, 안 되면 작업을 멈추고 묻는다. TDS는 설치하지 않는다.

## API

### 주소

클라이언트가 API를 부르는 곳 3곳(`fetch-candidates.ts`, `fetch-recipe-detail.ts`, `save-recipe-image.ts`)은 `shared/config`의 `apiUrl(path)`로 주소를 만든다.

- 웹: `/api/...`(같은 출처). 지금과 같다
- 미니앱: `SITE.url` + `/api/...`. `SITE.url`은 `https://taltal.vercel.app`이다

### CORS

`src/_app/api-routes/cors.ts`에 허용 출처 확인과 응답 헤더를 둔다.

- 허용 출처: `https://taltal.apps.tossmini.com`, `https://taltal.private-apps.tossmini.com`. 같은 출처 요청은 `Origin`이 없거나 웹 주소라 그대로 처리한다
- 허용 출처면 `Access-Control-Allow-Origin`에 그 출처를 그대로 넣고 `Vary: Origin`을 붙인다. 아니면 CORS 헤더를 붙이지 않는다
- `POST /api/candidates`, `POST /api/recipes/[id]/image`는 `Content-Type: application/json`이라 사전 요청이 간다. 두 라우트에 `OPTIONS`를 더한다. 허용 메서드는 각 라우트의 메서드와 `OPTIONS`, 허용 헤더는 `Content-Type`이다
- 성공, 4xx, 5xx 응답 모두에 붙인다. 오류 응답에 없으면 브라우저가 오류 내용을 읽지 못한다

## 첫 방문 판단

- 웹: 그대로 둔다. `proxy.web.ts`와 쿠키를 쓴다
- 미니앱: 시작 홈(`/`)이 열릴 때 `Storage.getItem`으로 방문 시각을 읽는다. 값이 없거나 3일이 지났으면 `router.replace('/intro')`로 보낸다. 확인이 끝날 때까지 시작 홈을 그리지 않아 시작 홈이 잠깐 보였다 바뀌지 않게 한다
- 시작 버튼의 `markVisited`는 웹이면 쿠키를, 미니앱이면 `Storage.setItem`으로 지금 시각을 쓴다
- 두 동작은 `shared/lib/visit.ts` 안에서 `NEXT_PUBLIC_BUILD_TARGET`으로 나눈다. 화면 코드는 `markVisited`와 새로 두는 `useVisitGate`(미니앱에서만 판단하고 웹에서는 바로 통과)만 부른다

## 이미지 저장

- `widgets/recipe-detail-sheet/model/save-recipe-image.ts`의 `saveImage`를 환경으로 나눈다
- 미니앱: 받은 `Blob`을 Base64로 바꿔 `File.saveBase64({ data, fileName, mimeType: 'image/png' })`로 저장한다
- 웹: 지금 그대로다
- 저장 성공과 실패 안내는 지금 화면의 것을 그대로 쓴다

## Clarity

`src/_app/analytics/clarity.tsx`는 미니앱 빌드면 아무것도 그리지 않는다. `CLARITY_PROJECT_ID`가 없을 때와 같은 방식이다.

## 확인

- `npm run build`의 경로 표가 이 작업 전과 같다. `/`, `/intro`, `/ingredients`, `/results`, `/opengraph-image`는 정적, API 3개는 동적, Proxy가 있다
- `npm run build:ait`가 성공하고 `out/`에 `app/api`, 레시피 조리 과정이 없다
- 로컬 웹(`npm run dev`)에서 소개부터 레시피 이미지 저장까지 동작한다
- 결과 화면에서 재료 수정으로 갔다가 다시 요리 찾기를 누르면 이전 결과가 보이지 않고 계산 중부터 시작한다. 브라우저 뒤로가기·앞으로가기로 들어와도 같다
- 허용하지 않은 출처에서 `fetch`하면 브라우저가 응답을 막고, 미니앱 주소 출처의 사전 요청에는 허용 헤더가 온다(`curl`로 확인)
- QR로 연 미니앱에서 요구사항 문서의 확인 기준을 지킨다
- lint, `npm run typecheck`, `npm test`, `fsd-review`를 통과한다
