# 추천 로직 이전과 개발 도구 설정

`feat/amount-format`(`c73cac3`)의 추천 로직, 서버 API, 데이터 읽기, 양 표시 함수를 FSD 구조로 옮기고 개발 도구를 설정한다. 화면은 만들지 않는다.

- 이슈: #3 추천 로직 이전과 개발 도구 설정
- 기준 문서: `docs/data-contract.md`, `docs/architecture.md`
- 브랜치: `feat/core-logic-migration`(`main`에서 분기)

## 지킬 것

- 추천 로직의 동작은 바꾸지 않는다. 기존 테스트 27개의 내용과 기대값을 바꾸지 않고 새 경로에서 통과시킨다.
- 옛 화면(`src/components/planner/`)은 이 브랜치의 파일과 커밋 이력에 넣지 않는다. 그래서 브랜치를 합치지 않고 파일을 골라 가져온다.
- 레시피 데이터(`data/app/`)는 커밋하지 않는다.

## 폴더 이동

### 루트 `app/`

| 새 위치 | 가져올 곳 | 내용 |
| --- | --- | --- |
| `app/layout.tsx` | 지금 `src/app/layout.tsx` | 레이아웃. 전역 CSS는 `@/_app/styles`에서 가져온다 |
| `app/page.tsx` | 지금 `src/app/page.tsx` | 빈 화면. 화면 작업에서 바꾼다 |
| `app/favicon.ico` | 지금 `src/app/favicon.ico` | |
| `app/api/candidates/route.ts` | 새로 씀 | `@/_app/api-routes`의 처리 함수를 내보내기만 한다 |
| `app/api/recipes/[id]/route.ts` | 새로 씀 | 같음 |

### `src/`

| 새 위치 | 가져올 곳(`c73cac3`) | 내용 |
| --- | --- | --- |
| `_app/styles/globals.css` | 지금 `src/app/globals.css` | 토큰 적용은 앱 공통 기반 작업에서 한다 |
| `_app/api-routes/` | `src/app/api/*/route.ts` | 후보와 레시피 상세 처리 함수 |
| `features/find-meals/model/filter-candidates.server.ts` | `src/logic/recommend.ts` 일부 | `filterCandidates`, `MAX_CANDIDATES`. 서버 전용 |
| `features/find-meals/model/recommend.ts` | `src/logic/recommend.ts` 일부 | `recommend`, `PERISH_WEIGHT`. 브라우저에서 쓴다 |
| `features/find-meals/model/inventory.ts` | `src/logic/recommend.ts` 일부 | 두 함수가 함께 쓰는 계산과 `MAX_PURCHASES` |
| `features/find-meals/model/types.ts` | `src/logic/types.ts` 일부 | `Result`, `Meal`, `Leftover` |
| `features/find-meals/model/compare.ts` | `src/components/planner/planner.tsx`의 `compare`, `DISH_COUNTS`, 모드 정의 | 3·4·5가지 비교와 사지 않는·조금 사는 묶음 계산. 화면 코드는 가져오지 않는다 |
| `features/find-meals/api/` | `planner.tsx`의 후보 요청 | `POST /api/candidates` 요청 함수 |
| `entities/ingredient/model/` | `src/logic/types.ts` 일부, `src/lib/amount-format.ts`, `src/lib/amount.ts`의 `toGrams` | `Ingredient`, `Stock`, `INPUT_UNITS`, `InputUnit`, `toGrams`, `formatAmount`, `describeAmount`, `amountsReconcile` |
| `entities/ingredient/api/` | `src/server/data.ts` | 재료 읽기(서버 전용) |
| `entities/recipe/model/` | `src/logic/types.ts` 일부, `src/server/data.ts`의 `RecipeDetail` | `Recipe`, `RecipeIngredient`, `RecipeDetail` |
| `entities/recipe/api/` | `src/server/data.ts` | 레시피와 상세 읽기(서버 전용), 상세 요청 함수(브라우저) |
| `shared/db/` | `src/server/data.ts` 일부 | `APP_DATA_DIR` 또는 `data/app/`에서 JSON을 읽는 함수. 도메인 타입을 쓰지 않는다 |

- 슬라이스마다 `index.ts`로 공개 API를 내보낸다. 서버 전용 읽기 함수는 `index.server.ts`로 내보내고 파일 첫 줄에 `import "server-only"`를 둔다.
- `src/lib/amount.ts`의 `inUnit`, `shoppingAmount`, `num`, `defaultQty`는 가져오지 않는다.
- shadcn 컴포넌트(`src/components/ui/`)와 `src/lib/utils.ts`는 옮기지 않는다. 앱 공통 기반 작업에서 디자인 기준에 맞게 고치면서 `shared/ui`로 옮긴다. `components.json`은 전역 CSS 경로만 고친다.
- `next.config.ts`의 `outputFileTracingIncludes`와 `.gitignore`의 `/data/app/`를 가져온다.

## 코드 수정

- `INPUT_UNITS`, `InputUnit`을 추가하고 `unitGrams`를 `Partial<Record<InputUnit, number>>`, `inputUnits`를 `InputUnit[]`로 좁힌다. `formatAmount`, `toGrams`의 단위 인자도 `InputUnit`으로 바꾼다.
- 테스트용 가짜 재료의 `unitGrams`에서 입력 단위가 아닌 키(`약간` 등)를 뺀다.
- 주석에서 내부 카드 번호(`PROJ1-`), 기록 저장소 문서 이름, 저장소 공개 여부 설명을 지우고, "1일째"를 요리 순서 표현으로 바꾼다. 문서 경로는 `docs/` 기준으로 쓴다.

## 가짜 데이터

가짜 데이터는 테스트에서만 쓴다. 앱은 실제 데이터가 없으면 가짜 데이터로 대신하지 않고 API가 500 오류를 돌려준다.

- 가짜 재료와 레시피는 `features/find-meals/model/__fixtures__/`에 두고 공개 API로 내보내지 않는다. 레시피 상세의 가짜 데이터는 두지 않는다.
- 다음 결과 상태를 내는 재료 묶음을 같은 파일에 상수로 둔다.

| 상태 | 조건 |
| --- | --- |
| 정상 | 사지 않는 묶음으로 3·4·5가지가 모두 나온다 |
| 조금 사는 묶음 | 사지 않는 묶음과 결과가 다르다 |
| `partial` | 사지 않는 묶음으로 요청보다 적게 나온다 |
| `empty` | 두 묶음 모두 추천이 없다 |

- 데이터 파일이 있는지는 `assertAppData`로 읽기 전에 확인한다. 라우트가 데이터 없음과 다른 오류를 구분하기 위해서다.

## 개발 도구

### 테스트

- `node --test`를 Vitest로 바꾼다. `tsconfig`의 `@/` 별칭을 읽도록 설정한다.
- 기존 테스트 두 파일은 `node:test`의 `test`를 Vitest의 `test`로 바꾸고 import 경로를 고치는 것 말고는 고치지 않는다. `node:assert`는 Vitest에서도 동작하므로 단언문은 그대로 둔다. 새 위치의 코드 옆으로 옮긴다.
- 테스트를 더한다.
  - 3·4·5가지 비교: 가짓수가 늘어도 남는 비율이 줄지 않는 결과를 빼는지, `partial`을 어떻게 남기는지
  - 실제 데이터의 모든 재료에서 `inputUnits`가 `INPUT_UNITS` 안에 있고 `unitGrams`의 키와 같은지
  - 테스트용 가짜 데이터가 위 네 상태를 내는지
- 실제 데이터 테스트는 데이터가 없으면 건너뛴다. 실패로 두지 않는다.

### ESLint

사용자가 준 설정을 `eslint.config.mts`로 넣고 다음을 고친다.

- 슬라이스 내부 파일 차단 패턴이 `@/<층>/<슬라이스>/index.server`는 막지 않게 한다.
- 층 폴더가 없으면 `readdirSync`가 실패하지 않게 한다.
- 루트 `app/`과 `src/_app`에서도 슬라이스 내부 파일을 막는다.
- ESLint가 `.mts` 설정을 읽는지 확인하고, 필요하면 `jiti`를 넣는다.
- `eslint-config-next`를 설정이 쓰는 플러그인으로 바꾼다.

### Prettier, husky

- 사용자가 준 `.prettierrc`를 넣는다. `.prettierignore`에 `docs/`, `*.md`, `data/`를 넣는다.
- 기존 코드 전체 포맷은 다른 변경과 섞지 않고 따로 커밋한다.
- husky `pre-commit`은 `npx lint-staged && npm run typecheck`다. 테스트는 넣지 않는다.
- `lint-staged`: `*.{ts,tsx,mts,js,mjs}`는 `eslint --fix`와 `prettier --write`, `*.{json,css}`는 `prettier --write`.
- `typecheck` 스크립트를 더한다. 라우트 타입을 쓰므로 `next typegen`을 먼저 돌려야 하는지 확인한다.

## 대조

옮긴 뒤 `docs/data-contract.md`와 코드를 대조한다.

- 재료 차감, 묶음 고르기, 후보 고르기, 요리 순서, 3·4·5가지 비교 규칙
- 서버 API의 입력 검사와 실패 응답
- 밑반찬과 김치를 넣은 151개 데이터에서 1인분 g이 큰 레시피가 결과를 왜곡하는지
- 재료가 많을 때 탐색 시간

어긋나면 코드를 고치지 않고 사용자에게 확인한다. 결정한 내용은 `docs/data-contract.md`에 반영한다.

## 커밋 순서

1. 개발 도구 설정(ESLint, Prettier, husky, Vitest)
2. 폴더 이동과 로직 이전
3. 타입 좁히기와 주석 정리
4. 가짜 데이터 보강과 테스트 추가
5. 기존 코드 전체 포맷. 커밋할 때 husky가 바뀐 파일을 포맷하므로, 남는 파일만 정리한다. shadcn 컴포넌트는 포맷하지 않는다

## 완료 기준

- `npm test`가 실제 데이터가 있을 때와 없을 때 모두 통과한다. 없으면 실제 데이터 테스트를 건너뛴다. 기존 27개가 모두 들어 있다.
- `npm run lint`, `npm run typecheck`, `npm run build`가 통과한다.
- 서버 API 두 개가 성공, 400, 404, 데이터가 없을 때 500 응답을 문서대로 돌려준다.
- `fsd-review`에서 층 위반이 없다.
- 옛 화면 코드와 레시피 데이터가 브랜치에 없다.
- 새 경로를 총괄 세션에 알린다.
