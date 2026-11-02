# 앱 공통 기반

모든 화면이 함께 쓰는 토큰, 폰트, 앱 레이아웃, 공통 컴포넌트, 화면 전환과 입력 상태, 이미지 자산, 사용 기록을 만든다. 화면(소개, 시작 홈, 재료 입력, 추천 결과)은 만들지 않는다.

- 이슈: #4 앱 공통 기반
- Notion 태스크: PROJ1-119, PROJ1-121, PROJ1-69
- 기준 문서: `docs/requirements/foundation.md`, `docs/design.md`, `docs/copy.md`, `docs/architecture.md`
- 브랜치: `feat/app-foundation`(`main`의 `e26c2aa`에서 분기)

## 사용자와 정한 것

| 항목 | 결정 |
| --- | --- |
| Clarity 가림 범위 | 문서대로 재료 이름과 양을 가리지 않는다. `body`에 `data-clarity-unmask="true"`를 둔다. 입력칸 값은 Clarity가 어느 설정에서도 가리므로 검색어와 직접 입력한 수량은 녹화에 남지 않는다 |
| 이미지 크기 | 재료 그림은 256px, 다람쥐는 640px PNG로 줄여 `public/`에 넣는다. 줄이는 스크립트를 저장소에 둔다 |
| 임시 로고와 파비콘 | 로고 파일이 오기 전까지 머리글은 "탈탈" 글자를 낭만있구미체로 보여 주고, 파비콘은 `mascot.default`를 줄인 PNG를 쓴다 |
| 입력 상태 위치 | 저장소(스토어, 타입)는 `features/build-inventory`의 model에 둔다 |
| 입력 상태 도구 | zustand 스토어를 쓴다. 공급자 없이 모듈에 스토어 하나를 둔다 |
| 방문 여부 | localStorage 대신 쿠키에 저장하고, `proxy.ts`가 첫 방문을 `/intro`로 보낸다 |

## 토큰과 전역 CSS

`src/_app/styles/globals.css`를 다시 쓴다.

- `docs/tokens.css`의 내용을 옮긴다. shadcn 기본 oklch 값, `.dark` 블록, `@custom-variant dark`를 지운다.
- `--font-family-sans`와 `--font-family-display`의 첫 글꼴을 `next/font` 변수(`--font-suit`, `--font-gumi`)로 바꾼다.
- `@layer base`의 `outline-ring/50`을 지우고 포커스를 `:focus-visible`에 블루 3px, 간격 2px로 준다.
- `body`는 Light 배경, Ink 글자, 행간 1.5, `word-break: keep-all`이다.
- `docs/tokens.css`는 기준으로 남긴다. 두 파일이 어긋나지 않는지 테스트로 확인한다(아래 "테스트").

## 폰트

`src/_app/fonts/`에 기록 저장소 `design/fonts/`의 다섯 파일을 복사한다: `SUIT-Variable.woff2`, `GumiRomance-Regular.woff2`, `LICENSE-SUIT.txt`, `NOTICE-GumiRomance.md`, `gumi-romance-hangul.txt`.

- `src/_app/fonts/index.ts`에서 `next/font/local`로 두 서체를 불러오고 `variable`로 CSS 변수를 만든다.
- 낭만있구미체는 `declarations`로 `unicode-range`를 지정한다. 값은 기록 저장소 `design/fonts/fonts.css`의 것을 옮긴다. 그 밖의 글자는 SUIT로 대체돼 공백이 되지 않는다.
- `docs/design.md`의 "지원 글자 목록은 `gumi-romance-hangul.txt`다"는 경로를 `src/_app/fonts/gumi-romance-hangul.txt`로 적는다.

## 앱 레이아웃

`app/layout.tsx`는 `src/_app`에서 가져온 레이아웃을 내보내기만 한다. 레이아웃은 `src/_app/layout/`에 둔다.

- `html`에 폰트 변수 클래스와 `lang="ko"`를 둔다.
- 앱 열은 가운데 448px(`--app-max-width`)이고 Light 배경이다. 좌우 Ink 선(기본 선 3px)은 열 바깥에 가상 요소로 그려서, 화면이 448px 이하이면 화면 밖으로 나가 보이지 않는다. 새 breakpoint를 만들지 않기 위해서다. 가로 넘침은 앱 열을 감싼 `.app-frame`의 `overflow-x: clip`으로 막는다. `body`에 두면 값이 화면(viewport)으로 넘어가 잘리지 않고 선 굵기만큼 가로 스크롤이 생긴다.
- `body`에 `data-clarity-unmask="true"`를 둔다. 바텀시트는 `body` 아래 포털로 그려져 앱 열 밖에 있으므로 앱 열에 달면 시트 안의 재료 이름과 양이 가려진다.
- 메타데이터는 `src/shared/config/site.ts`의 서비스 이름과 한 줄 설명을 쓴다. 제목은 "탈탈", 설명은 copy.md 소개 설명("산 재료를 나눠 쓰는 요리 3~5가지를 알려 드려요.")이다. `openGraph`에 같은 제목, 설명, `ko_KR`을 넣는다. 공유 이미지는 넣지 않는다.
- 파비콘은 `metadata.icons`에 `src/shared/assets`의 경로를 넣는다. `app/favicon.ico`는 지운다. 파일 규칙 파비콘이 `metadata.icons`보다 앞서기 때문이다.

## 이미지 자산

### 파일과 스크립트

`scripts/build-image-assets.mjs`가 기록 저장소에서 이미지를 읽어 줄이고 경로 파일을 만든다. 기록 저장소 경로는 인자로 받는다. `sharp`를 devDependency로 더한다.

| 출력 | 내용 |
| --- | --- |
| `public/images/ingredients/<file>` | `delivery-manifest.json`의 `assets` 32개를 256px로 줄인 PNG. 이름은 manifest의 `file`을 쓴다 |
| `public/images/mascot/<식별자>.png` | design.md 표의 여섯 파일을 640px로 줄인 PNG. 이름은 `default`, `discovery`, `thinking`, `meal`, `retry`, `question` |
| `public/brand/favicon.png`, `public/brand/apple-icon.png` | `squirrel-v2.png`를 64px, 180px로 줄인 PNG. 로고가 오면 바꾼다 |
| `src/entities/ingredient/model/ingredient-images.ts` | manifest의 `ingredients`에서 만든 재료 ID → 경로 객체(`INGREDIENT_IMAGES`)와 대체 그림 경로(`INGREDIENT_FALLBACK_IMAGE`). 키가 재료 ID라서 shared가 아니라 entities에 둔다 |

스크립트는 manifest의 `source_sha256`과 실제 `ingredients.json`의 해시가 다르면 경고만 하고 계속한다. 데이터가 바뀌어도 대체 그림 규칙으로 동작하기 때문이다.

### 경로 모음 `src/shared/assets`

도메인과 무관한 이미지의 경로만 둔다.

| 내보내는 것 | 내용 |
| --- | --- |
| `MASCOT_IMAGES` | `default`, `discovery`, `thinking`, `meal`, `retry` → 경로 |
| `BRAND` | `logo: string \| null`, `favicon`, `appleIcon`. 지금 `logo`는 `null`이다 |

로고와 파비콘 경로는 `BRAND` 한 곳에만 있다. 로고 파일이 오면 `public/brand/`에 넣고 `BRAND.logo`를 채운다.

### 컴포넌트

- `entities/ingredient/ui/ingredient-image.tsx`의 `IngredientImage`: 재료 ID로 경로를 찾고, 없으면 대체 그림을 쓴다. 불러오기에 실패하면(`onError`) 대체 그림으로 바꾼다. `alt=""`다.
- `shared/ui/mascot.tsx`의 `Mascot`: `pose`로 `MASCOT_IMAGES`를 찾는다. `object-fit: contain`으로 전체를 보여 주고, `alt`는 기본값이 빈 문자열이다.
- 두 컴포넌트 모두 `next/image`에 `unoptimized`를 준다. 미리 줄여 두었기 때문이다.

## 공통 컴포넌트

### shadcn 이동

`src/components/ui/`를 `src/shared/ui/`로, `src/lib/utils.ts`를 `src/shared/lib/cn.ts`로 옮긴다. `components.json`의 별칭을 `@/shared/ui`, `@/shared/lib/cn`으로 고친다.

| 컴포넌트 | 처리 | 쓰는 곳 |
| --- | --- | --- |
| `button` | 디자인 기준으로 고친다 | 모든 화면 |
| `drawer` | `BottomSheet`의 바탕으로 고친다 | 시트 세 개 |
| `input`, `label` | 고친다 | 검색칸, 직접 입력 |
| `toggle`, `toggle-group` | 고친다 | 인분, 가짓수, 단위 |
| `collapsible` | 그대로 둔다 | 양념 목록, 사용량 내역 |
| `card`, `separator` | 고친다 | 카드, 장식 구분선 |
| `alert` | `StatusMessage`로 바꾼다 | 오류와 안내 |
| `badge`, `progress`, `select`, `skeleton` | 지운다 | 쓰는 화면이 없다. 단위 고르기는 `toggle-group`을 쓴다 |

고칠 때 지키는 기준은 다음과 같다.

- 그림자, 투명도로 만든 색(`/50` 같은 수식어), backdrop blur를 지운다.
- 라운딩은 컨트롤 8px, 카드 12px, 시트 20px만 쓴다. 기본 선과 선택 선은 모두 3px이다. 선택은 선 굵기가 아니라 체크와 면 색으로 구분한다.
- 비활성은 투명도 대신 Light 면, Muted 글자, Subtle 선이다.
- 터치 영역은 44px 이상, 주 행동은 48px이다.

### Button

| `variant` | 모습 |
| --- | --- |
| `primary` | Primary 면, Ink 글자, Ink 선. `.surface-brand` 안에서는 토큰이 바뀌어 Ink 면, Light 글자가 된다 |
| `secondary` | Light 면, Ink 글자, Ink 선 |
| `ghost` | 면과 선 없음. 아이콘을 받는다. 밝은 면에서는 hover 시 블루, 주황 면에서는 밑줄 |

hover와 pressed(`:active`)는 `#234386` 면, White 글자다. `loading`을 주면 폭을 유지한 채 스피너와 문구를 보여 주고 `aria-busy`와 `disabled`를 단다.

### BottomSheet

vaul `Drawer`로 만든다.

- 시트 뒤는 `--scrim`(Ink 50%)으로 덮는다. 위쪽 라운딩 20px, 안쪽 16px, 높이는 화면의 90%까지이고, 열기와 닫기는 320ms `--easing-sheet`다.
- 시트 본문은 `overflow-y: auto`와 `overscroll-behavior: contain`으로 본문 스크롤과 섞이지 않게 한다.
- 제목은 `Drawer.Title`, 닫기 버튼은 Ghost로 둔다. Esc로 닫힌다.
- 가상 키보드가 열려도 입력칸과 주 행동이 보이게, 주 행동을 시트 아래에 고정하고 `visualViewport`에 맞춘다. vaul의 `repositionInputs`는 끈다. 시트 위쪽 여백을 남긴 채 높이만 줄여서, Android에서 검색칸에 포커스하면 재료 격자가 거의 보이지 않았기 때문이다. 대신 `shared/lib/use-visual-viewport.ts`로 키보드가 가린 높이만큼 시트를 올리고, 시트 안 입력칸에 포커스가 있는 동안에는 시트의 최대 높이를 보이는 높이 전체로 늘린다.
- 앱 열과 같은 폭(최대 448px)으로 가운데 둔다. `html`의 `scrollbar-gutter: stable`이 스크롤바 자리를 늘 비워 두므로, 시트가 열릴 때 Radix가 `body`에 넣는 오른쪽 여백을 0으로 덮는다. 덮지 않으면 시트를 열 때 앱 열이 왼쪽으로 밀린다.
- vaul은 기본으로 열 때 포커스를 옮기지 않으므로 `autoFocus`를 켠다. 키보드로 열면 포커스가 시트 안에서 시작한다.
- vaul이 넣는 0.5s 전환은 전역 CSS에서 `--duration-sheet`로 덮는다. 끌어 놓을 때 vaul이 inline으로 넣는 전환도 덮어야 해서 `!important`를 쓴다.

### 시트와 브라우저 기록

시트는 주소 쿼리 `?sheet=<이름>`으로 연다. `shared/lib/use-sheet-route.ts`의 `useSheetRoute(name)`이 맡는다.

- 열 때 `window.history.pushState`로 쿼리를 더한다. Next.js가 `useSearchParams`와 맞춰 주고 서버 요청을 하지 않는다.
- 닫기 버튼, Esc, 막 누르기로 닫으면 `history.back()`을 부른다. 주소로 바로 들어와 앞 기록이 없으면 쿼리만 지운다(`replaceState`).
- 빠르게 두 번 눌러도 기록을 한 번만 더하고 한 번만 되돌린다. 렌더된 `open` 값은 아직 바뀌지 않았을 수 있어서, 열 때는 주소의 쿼리를 직접 보고 닫을 때는 `history.back()`을 부른 뒤 닫힐 때까지 다시 부르지 않는다.
- 브라우저 뒤로가기로 쿼리가 사라지면 시트가 닫힌다.

닫은 뒤 포커스는 다음 순서로 옮긴다. vaul의 기본 복귀는 끈다(`onCloseAutoFocus`에서 `preventDefault`).

1. 시트를 연 요소. 여는 버튼에 `data-sheet-opener="<뜻>"`을 단다.
2. 그 요소가 다시 그려졌으면 같은 `data-sheet-opener` 값을 가진 요소.
3. 없으면 `data-back-button`이 달린 뒤로가기 버튼.

본문 스크롤 위치는 열 때 기억하고 닫은 뒤 되돌린다. 포커스를 옮길 때 `preventScroll: true`를 준다.

### 머리글 `AppHeader`

`shared/ui/app-header.tsx`. 왼쪽에 선택적인 뒤로가기 버튼(`data-back-button`), 가운데 로고를 둔다. 로고는 `BRAND.logo`가 있으면 이미지, 없으면 사이트 이름을 `font-display`로 보여 준다. 뒤로가기는 앱 안에서 온 기록이 있으면 `history.back()`, 없으면 받은 주소로 간다.

앱 안의 기록은 `shared/lib/app-history.ts`가 센다. `_app/providers`가 한 번 다는 `useAppHistoryTracker`가 경로가 바뀔 때마다 깊이를 하나 늘리고, `popstate`로 돌아온 경로면 하나 줄인다. 시트는 쿼리만 바꾸므로 세지 않는다. 첫 화면과 같은 경로는 세지 않는데, 개발 모드의 Strict Mode가 효과를 두 번 돌리므로 "첫 실행 건너뛰기"가 아니라 이전 경로와 비교해서 판단한다. 브라우저 앞으로가기도 줄이는 쪽으로 세지만, 깊이가 실제보다 작아지면 받은 주소로 가므로 앱을 나가지 않는다.

### StatusMessage

`shared/ui/status-message.tsx`. `tone`(`success`, `warning`, `error`, `info`), 제목과 설명(문자열), 행동 버튼 자리를 받는다. Light 바탕, Ink 글자와 기본 선 굵기의 Ink 외곽선, 왼쪽 3px 상태색 강조선, 상태별 lucide 아이콘이다. 화면 읽기에는 숨긴 live region으로 제목과 설명을 한 번 전달한다. `error`는 `role="alert"`, 나머지는 `role="status"`다. 처음부터 글자를 담고 나타난 live region은 읽히지 않을 수 있어서, 비운 채 그린 뒤 다음 작업에서 채운다(`shared/lib/use-mounted.ts`). 보이는 제목과 설명은 중복해서 읽히지 않게 `aria-hidden`을 둔다.

### 로딩

- `shared/ui/spinner.tsx`의 `Spinner`: `--spinner-duration`으로 돈다. 동작 줄이기에서는 멈춘다.
- `shared/ui/loading-status.tsx`의 `LoadingStatus`: 문구 배열을 받아 1.2초마다 바꾸고, 화면 읽기에는 받은 고정 안내를 한 번만 전달한다. 안내를 담는 `role="status"`는 `StatusMessage`와 같은 방법으로 마운트 뒤에 채운다. 동작 줄이기에서는 첫 문구를 유지한다. 문구는 SUIT다.
- `shared/lib/with-min-duration.ts`: 프로미스가 2.4초보다 빨리 끝나도 2.4초 뒤에 결과를 돌려준다.

## 입력 상태

`features/build-inventory/model/inventory-store.ts`에 zustand 스토어를 두고, 타입과 처음 상태는 `inventory.ts`에 둔다.

```ts
type InventoryItem = {
  ingredientId: string;
  amount: number | null; // 양을 정하지 않았으면 null
  unit: InputUnit;       // 사용자가 고른 단위. 결과 화면까지 유지한다
};

type InventoryState = { items: InventoryItem[]; servings: number };
```

- 스토어 훅 `useInventory`를 공개 API로 내보낸다. 상태를 바꾸는 함수는 `addItems`, `setAmount`, `removeItem`, `setServings`, `reset`이다. 재료 입력 화면 작업에서 필요한 함수를 더할 수 있다.
- 상태는 브라우저 메모리에만 둔다. 새로고침하면 초기화된다.
- zustand 문서는 Next.js에서 요청마다 스토어를 만들라고 권한다. 서버에서 값을 바꾸면 요청 사이에 섞이기 때문이다. 이 앱은 서버가 처음 상태를 그리기만 하고 값은 브라우저에서만 바꾸므로 스토어 하나로 둔다.
- 인분 기본값은 2다.
- 공급자가 필요 없다. `src/_app/providers/`의 `AppProviders`는 앱 안 기록 세기(`useAppHistoryTracker`)만 단다.

## 첫 방문

방문 여부는 쿠키에 저장하고, 루트의 `proxy.ts`가 `/` 요청에서 쿠키를 확인한다. 서버가 HTML을 보내기 전에 보낼 곳을 정하므로 소개나 시작 홈이 잠깐 보였다 사라지지 않는다.

- 쿠키 이름과 보관 기간(3일)은 `shared/config/visit.ts`에 둔다. 값은 `1`, `Path=/`, `SameSite=Lax`이고 HTTPS에서는 `Secure`를 붙인다.
- `proxy.ts`는 `matcher`를 `/` 하나로 두고, 쿠키가 없으면 `/intro`로 307 리다이렉트한다. 모집 글 링크의 추적 쿼리를 잃지 않게 쿼리는 그대로 넘긴다. 쿠키 이름은 `@/shared/config/visit`에서 바로 가져온다. 묶음(`@/shared/config`)을 거치면 화면 문구까지 proxy에 딸려 오기 때문이다. `/` 페이지는 쿠키를 읽지 않아 정적으로 남는다.
- `shared/lib/visit.ts`의 `markVisited()`가 `document.cookie`로 쿠키를 쓴다. 소개의 시작 버튼이 이 함수를 부른 뒤 `router.replace('/')`로 간다. `replace`라서 소개는 기록에 남지 않는다.
- 소개에서 `/`로 가는 `Link`는 두지 않는다. 쿠키를 쓰기 전에 프리페치한 리다이렉트 응답이 남아 다시 소개로 돌아올 수 있기 때문이다. 시작 버튼이 실제로 시작 홈으로 가는지는 소개 화면 작업에서 확인한다.
- `/intro`에 바로 들어오면 방문 여부와 관계없이 소개를 보여 준다.

## 문구

`src/shared/copy/index.ts`에 `docs/copy.md`의 모든 화면 문구를 화면별 객체로 옮긴다. `{이름}`이 있는 문구는 인자를 받는 함수로 만든다. 화면 작업이 나란히 진행될 때 같은 파일을 동시에 고치지 않도록 이번에 모두 옮긴다.

## 사용 기록

`src/_app/analytics/clarity.tsx`가 `next/script`(`afterInteractive`)로 Clarity 태그를 불러온다.

- 프로젝트 ID는 `NEXT_PUBLIC_CLARITY_PROJECT_ID`다. `shared/config/env.ts`에서 읽고, 값이 없으면 아무것도 그리지 않는다. 로컬과 프리뷰에는 넣지 않는다.
- Vercel 프로덕션 환경 변수에 값을 넣는 일은 사용자가 한다. 배포 워크플로가 `vercel pull`로 받아 빌드에 넣는다.
- 가림 범위는 "사용자와 정한 것"의 표를 따른다. `docs/requirements/foundation.md`의 사용 기록 항목에 "입력칸 값은 Clarity가 늘 가린다"를 더한다.

PROJ1-121에서 확인한 것은 다음과 같다. Microsoft Learn 문서로 확인했고, 실제 프로젝트에서는 아직 확인하지 않았다.

| 질문 | 확인한 내용 |
| --- | --- |
| 무료 범위 | 무료이고 트래픽 한도나 유료 전환이 없다 |
| 사용자가 적을 때 녹화가 남는지 | 표본 추출 없이 모든 세션을 녹화한다. 녹화(재생 데이터)는 30일, 라벨이나 즐겨찾기를 단 세션은 9개월 보관한다. 테스트 녹화는 30일 안에 즐겨찾기로 남겨야 한다 |
| 가림 | 기본 Balanced 모드는 숫자와 이메일을 가린다. 입력칸과 드롭다운 값은 모든 모드에서 가리고 바꿀 수 없다. `data-clarity-unmask`가 대시보드 설정보다 앞선다 |

배포 뒤 실제 세션 하나를 녹화해 재료 이름과 정한 양이 보이고 입력칸 값이 가려지는지 확인한다.

## 문서 반영

| 문서 | 고칠 곳 |
| --- | --- |
| `docs/overview.md` | 화면 사이의 상태 표에서 방문 여부의 저장 위치를 쿠키로 바꾼다 |
| `docs/architecture.md` | `_app` 세그먼트에 `layout`을 더한다. `build-inventory`가 입력 상태 저장소를 갖고 `_app/providers`는 달기만 한다고 적는다. `shared/assets`는 다람쥐, 로고, 파비콘 경로를 담고, 재료 그림 경로 표는 `entities/ingredient`가 갖는다고 적는다. 루트 파일 예시를 `proxy.ts`로 바꾸고, `/`의 첫 방문 리다이렉트를 `proxy.ts`가 맡는다고 적는다 |
| `docs/requirements/foundation.md` | 사용 기록에 입력칸 값 가림을 더한다 |
| `docs/design.md` | 지원 글자 목록 경로. 그림 파일이 앱에서 256px, 640px로 줄어 들어간다는 것 |

## 테스트

- 토큰: `globals.css`의 `:root` 변수가 `docs/tokens.css`와 같은지 확인한다.
- 임의 값: `src/`와 `app/`의 `.tsx`, `.ts`에 HEX 색, Tailwind 임의 값(`-[...]`), 투명도 수식어(`/숫자`), 허용하지 않은 간격 숫자(5, 7, 10 등), `shadow-` 클래스가 없는지 확인한다. `globals.css`와 생성 파일은 뺀다.
- 폰트: `unicode-range`의 한글 음절이 `gumi-romance-hangul.txt`와 같은지 확인한다.
- 이미지: `MASCOT_IMAGES`, `BRAND`의 경로(`shared/assets`)와 `INGREDIENT_IMAGES`의 경로(`entities/ingredient`)에 파일이 있는지 각 위치의 테스트에서 확인한다. 실제 데이터가 있으면 `pantry`가 `null`인 재료가 모두 전용 그림을 받는지 본다.
- `IngredientImage`: 없는 ID와 불러오기 실패에서 대체 그림을 쓰는지 확인한다.
- `useSheetRoute`: 열기, 닫기, 뒤로가기, 앞 기록 없는 진입을 확인한다.
- `proxy.ts`: 쿠키가 없으면 `/intro`로 리다이렉트하고, 있으면 통과시키는지 확인한다.
- `withMinDuration`, `markVisited`, 입력 상태 함수의 단위 테스트를 둔다.
- 컴포넌트 테스트를 위해 `@testing-library/react`와 `jsdom`을 더한다. 기존 테스트는 node 환경을 유지하고, 새 컴포넌트 테스트만 파일 첫 줄 주석으로 jsdom을 쓴다.

## 커밋 순서

커밋할 때 husky가 타입 검사를 돌리므로, 커밋마다 그 시점의 파일만으로 타입 검사가 통과하도록 의존 순서대로 나눈다.

1. shadcn과 `cn` 이동. 내용은 import 경로만 바꾼다
2. 화면 문구와 설정 상수
3. 이미지 자산 스크립트와 생성 파일, 이미지 컴포넌트
4. 토큰, 전역 CSS, 공통 컴포넌트와 시트 기록
5. 입력 상태 저장소
6. 첫 방문 proxy
7. 폰트, 루트 레이아웃, 메타데이터, Clarity
8. 디자인 값 검사 테스트
9. 문서 반영

## 완료 기준

- `docs/requirements/foundation.md`의 확인 기준을 지킨다.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`가 통과한다.
- `fsd-review`에서 층 위반이 없다.
- `src/components/`와 `src/lib/`가 남아 있지 않다.
