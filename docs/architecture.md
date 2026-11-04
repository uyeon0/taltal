# 아키텍처

코드의 폴더 구조와 모듈 사이의 의존 규칙을 정한다. 구조는 [Feature-Sliced Design](https://feature-sliced.design/)(FSD)을 따르고, Next.js와 함께 쓰는 방법은 FSD 공식 안내를 따른다.

## 폴더 배치

```text
app/                  Next.js 라우트 파일만 둔다
src/
├── _app/             앱 전체 설정
├── _pages/           화면
├── widgets/          화면의 큰 덩어리
├── features/         사용자 동작
├── entities/         도메인 데이터와 규칙
└── shared/           도메인과 무관한 공통 코드
```

- Next.js의 `app/`은 프로젝트 루트에 두고, `src/`에는 FSD 코드만 둔다.
- FSD의 `app`, `pages` 층은 Next.js 폴더 이름과 겹치지 않게 `_app`, `_pages`로 쓴다.
- `proxy.web.ts`처럼 Next.js가 루트에 두기를 요구하는 파일은 루트 `app/` 옆에 둔다.
- 서버가 있어야 동작하는 라우트 파일(API 라우트, `proxy`)은 이름에 `.web`을 붙인다. 웹 빌드에만 들어가고 앱인토스 미니앱 빌드에서는 빠진다(`docs/specs/apps-in-toss.md`).

## 의존 규칙

```text
_app → _pages → widgets → features → entities → shared
```

- 모듈은 자기보다 아래 층만 import한다.
- `_app`과 `shared`를 뺀 층은 슬라이스로 나뉜다. 같은 층의 다른 슬라이스를 import하지 않는다.
- 슬라이스 밖에서는 슬라이스의 공개 API(`index.ts`)로만 가져온다.
- 서버에서만 쓰는 코드는 파일 이름을 `*.server.ts`로 짓고 첫 줄에 `import 'server-only'`를 둔다. 슬라이스 밖으로는 `index.server.ts`로만 내보내고, `index.ts`에는 넣지 않는다.
- 브라우저 코드가 `index.server.ts`를 import하면 빌드가 실패한다. 서버와 브라우저가 함께 쓰는 순수 함수는 `.server`를 붙이지 않은 파일에 둔다.
- 슬라이스 안에서는 자기 슬라이스의 파일을 상대 경로로 가져온다. `@/` 경로는 다른 슬라이스의 공개 API를 가져올 때만 쓴다.
- 이 규칙은 ESLint(`eslint.config.mts`)로 강제한다. 상위 층, 같은 층의 다른 슬라이스, 슬라이스 내부 파일을 가져오면 lint가 실패한다.
- 이 규칙에는 예외를 두지 않는다. 규칙을 지키기 어려운 코드가 생기면 위치를 다시 정하고, 정하기 어려우면 사용자에게 확인한다.

## 라우트

루트 `app/`의 파일은 `_pages`나 `_app`에서 가져온 것을 내보내기만 한다.

| 주소 | 화면 | `_pages` 슬라이스 |
| --- | --- | --- |
| `/` | 시작 홈. 첫 방문이면 `/intro`로 보낸다 | `home` |
| `/intro` | 소개 | `intro` |
| `/ingredients` | 재료 입력 | `ingredients` |
| `/results` | 추천 결과 | `results` |
| `POST /api/candidates` | 후보 레시피 | `_app/api-routes` |
| `GET /api/recipes/[id]` | 레시피 상세 | `_app/api-routes` |
| `POST /api/recipes/[id]/image` | 레시피 이미지(PNG) | `_app/api-routes` |

- 웹의 첫 방문 리다이렉트는 루트 `proxy.web.ts`가 맡는다. `/` 요청에 방문 쿠키가 없으면 `/intro`로 보낸다. 서버가 화면을 보내기 전에 정하므로 소개나 시작 홈이 잠깐 보이지 않는다. 미니앱에서는 시작 홈이 앱인토스 `Storage`를 읽어 정하고, 정할 때까지 화면을 그리지 않는다.
- 재료 선택, 사용량, 레시피 상세 시트는 주소의 쿼리로 연다. 그래서 브라우저 뒤로가기로 시트를 닫을 수 있다.
- 입력 상태는 브라우저 메모리에만 있다. `/results`에서 새로고침하거나 결과 없이 들어오면 시작 홈으로 보낸다.

## 층별 구성

### `_app`

| 세그먼트 | 담는 것 |
| --- | --- |
| `layout` | 루트 레이아웃과 메타데이터. 앱 열, 폰트, 공급자, Clarity를 조립한다 |
| `providers` | 앱 전체에 한 번만 다는 것. 지금은 뒤로가기 버튼이 쓰는 앱 안 기록 세기다 |
| `styles` | 전역 CSS와 토큰. 서버 이미지가 쓸 색을 전역 CSS에서 꺼내는 함수 |
| `fonts` | `next/font/local` 설정과 서버 이미지용 글꼴 파일 |
| `api-routes` | 서버 API의 처리 함수 |
| `analytics` | Microsoft Clarity |

### `_pages`

`intro`, `home`, `ingredients`, `results`. 화면마다 슬라이스 하나다. 아래 층을 조립하고, 화면 전용 배치와 상태를 가진다.

### `widgets`

| 슬라이스 | 담는 것 |
| --- | --- |
| `ingredient-list` | 담은 재료 목록과 수량 편집 |
| `result-summary` | 다 쓰는 재료와 남는 재료 요약 |
| `meal-list` | 요리 카드 목록 |
| `usage-sheet` | 재료별 사용량 시트 |
| `recipe-detail-sheet` | 레시피 상세 시트 |

### `features`

| 슬라이스 | 담는 것 |
| --- | --- |
| `build-inventory` | 재료 고르기, 양 정하기, 인분 고르기. 추천에 넣을 입력을 만드는 동작과 입력 상태 저장소(zustand 스토어 `useInventory`). 재료 입력 화면이 쓰는 재료 목록은 `index.server.ts`로 내보낸다 |
| `find-meals` | 요리 찾기 요청, `filterCandidates`, `recommend`, 3·4·5가지 비교, 결과 타입(`Result`, `Meal`, `Leftover`). 브라우저의 묶음 계산은 화면 입력을 멈추지 않게 Web Worker에서 돌린다 |

- `find-meals`는 사지 않는 묶음과 조금 사는 묶음을 함께 돌려준다. 어느 쪽을 보여 줄지는 결과 화면이 정한다.
- `build-inventory`와 `find-meals`는 서로 import하지 않는다. 입력을 결과로 넘기는 일은 `_pages`가 맡는다. 결과 화면은 `build-inventory`의 `useInventory`로 입력을 읽어 `find-meals`에 넘긴다.
- 입력 상태 저장소는 `_pages`가 읽어야 하므로 `_app`이 아니라 `build-inventory`에 둔다. zustand 스토어라 공급자를 달지 않는다.

### `entities`

| 슬라이스 | 담는 것 |
| --- | --- |
| `ingredient` | `Ingredient`, `INPUT_UNITS`, `toGrams`, `formatAmount`, 재료 이미지와 재료 ID별 그림 경로 표 |
| `recipe` | `Recipe`, `RecipeDetail`, 레시피 읽기와 상세 조회 |

`Recipe`는 재료를 `ingredientId` 문자열로만 가리킨다. 그래서 `recipe`는 `ingredient`를 import하지 않는다.

### `shared`

| 세그먼트 | 담는 것 |
| --- | --- |
| `ui` | shadcn 컴포넌트와 공통 UI |
| `lib` | 도메인과 무관한 함수 |
| `api` | 브라우저의 요청 함수 |
| `db` | 서버에서 JSON 파일을 읽는 함수. 도메인 타입을 붙이지 않는다 |
| `config` | 환경 변수와 상수 |
| `copy` | `docs/copy.md`의 화면 문구 |
| `assets` | 다람쥐, 로고, 파비콘의 경로 |

`shared`에는 재료, 레시피, 추천 같은 도메인의 이름과 규칙을 넣지 않는다. 앱 데이터에 도메인 타입을 붙이는 일은 `entities`의 서버 전용 함수가 맡는다.

재료 그림 경로 표는 키가 재료 ID라서 `shared/assets`가 아니라 `entities/ingredient`에 둔다. 표는 `scripts/build-image-assets.mjs`가 만들고, 그림 파일은 Next.js가 정적 파일로 내보내도록 `public/images/`에 둔다.

## 테스트

테스트 파일은 테스트하는 파일 옆에 둔다. 실제 데이터로 도는 테스트는 `APP_DATA_DIR` 환경 변수로 데이터 폴더를 받는다.

## 점검

구조를 바꾸거나 슬라이스를 추가하면 `fsd-review` 스킬로 의존 방향과 층 위반을 점검한다.
