# 추천 결과

재료 입력에서 요리 찾기를 누르면 들어오는 화면(`/results`)을 만든다. 계산 중, 추천 결과, 사용량 시트, 추천 없음과 오류를 이 화면이 맡는다. 레시피 상세 시트는 세션 E가 만들고, 이 화면은 시트를 여는 쪽만 만든다.

- 이슈: #7 추천 결과 화면
- 기준 문서: `docs/requirements/results.md`, `docs/data-contract.md`, `docs/design.md`, `docs/copy.md`, `docs/architecture.md`
- 참고 시안: `docs/wireframes/recipe-results-wireframe.html`, `integrated-flow-wireframe.html`
- 입력: `docs/specs/ingredient-input.md`의 "결과 화면에 넘기는 입력"
- 브랜치: `feat/results`(`main`의 `8390c37`에서 분기, `a96eeb5`까지 받음)

## 사용자와 정한 것

| 항목 | 결정 |
| --- | --- |
| 레시피 상세 연결 | 결과 화면이 시트 주소와 연 요리를 갖고, 위젯은 세션 E가 만든다. 아래 "레시피 상세 시트 열기"를 따른다 |
| 머지 순서 | 이 브랜치가 먼저 머지된다. 머지된 뒤 세션 E가 rebase해서 시트를 `_pages/results`에 끼운다. 그 사이에는 카드를 눌러도 주소만 바뀌고 시트는 열리지 않는다 |
| 조금 사는 묶음 제안 | 조금 사는 묶음이 사지 않는 묶음과 다르고 더 덜 남을 때만 제안 카드를 보여 준다(아래 "조금 사는 묶음") |
| 묶음을 바꿀 때 탭 | 바꿀 때마다 그 묶음에서 가짓수가 가장 많은 탭을 고른다 |
| 사용량 시트 순서 | 처음 양 대비 남는 비율이 큰 재료부터 놓는다 |
| 계산 위치 | 실제 데이터에서 재료 13개로 `findMealOptions`가 PC에서 364ms 걸렸다. 휴대폰에서는 화면이 멈출 수 있어 Web Worker에서 계산한다 |

## 슬라이스와 파일

| 위치 | 담는 것 |
| --- | --- |
| `app/results/page.tsx` | `_pages/results`의 화면을 내보내기만 한다 |
| `_pages/results` | 서버에서 재료 목록을 읽는 서버 컴포넌트, 입력 확인과 리다이렉트, 계산 상태, 계산 중·추천 없음·오류 화면, 결과 배치, 묶음과 탭 상태, 시트 열기 |
| `widgets/result-summary` | 다 쓰는 재료와 남는 재료 요약, 사용량 버튼 |
| `widgets/meal-list` | 요리 카드 목록 |
| `widgets/usage-sheet` | 재료별 사용량 시트 |
| `features/find-meals` | 후보 받기와 Worker 계산을 묶은 `searchMeals`, 요리별 사는 재료, 남는 재료 나누기, 재료별 배분, 제안 판단 |
| `shared/ui` | 가짓수 탭에 쓰는 `Tabs`(Radix Tabs), `AppHeader`의 글자 있는 뒤로가기 |

`find-meals`의 공개 API에 다음을 더한다.

| 내보내는 것 | 파일 | 내용 |
| --- | --- | --- |
| `searchMeals` | `api/search-meals.ts` | 후보를 받고 두 묶음을 계산한다(아래 "계산") |
| `mealPurchases`, `MealPurchases` | `model/purchases.ts` | 요리 하나의 사야 하는 재료와 있으면 좋은 재료 |
| `splitLeftovers`, `USED_UP_GRAMS` | `model/leftovers.ts` | 다 쓴 재료와 남는 재료를 나눈다 |
| `allocateStock`, `StockAllocation` | `model/allocation.ts` | 가진 재료별로 요리마다 쓰는 양과 남는 양 |
| `shouldSuggestBuy` | `model/compare.ts` | 조금 사는 묶음 제안을 보여 줄지 |

`mealPurchases`는 세션 E의 상세 시트도 쓴다. 이름이나 시그니처를 바꾸면 세션 E에 알린다.

## 데이터 읽기

`_pages/results`의 서버 컴포넌트가 `getIngredients()`로 양념까지 모든 재료를 읽어 클라이언트 화면에 props로 넘긴다. `recommend`가 보관 등급과 특수 양념을 보려면 양념까지 필요하다. 지금 데이터는 122개, 30KB다. 읽기 함수가 `'use cache'`라 화면은 빌드할 때 정적으로 만들어진다. 시트 상태를 주소 쿼리에서 읽으므로 `Suspense`로 감싼다.

화면은 `useInventory`에서 `items`와 `servings`를 읽는다. 재료 id → 사용자가 고른 단위 표(`Record<string, InputUnit>`)를 만들어 양 표시에 쓴다.

## 화면 상태

| 상태 | 화면 |
| --- | --- |
| 입력 없음 | `isInventoryReady`가 `false`면 `router.replace('/')`로 보내고 아무것도 그리지 않는다. 새로고침과 주소로 바로 들어온 경우다 |
| 계산 중 | 다람쥐(`mascot.thinking`)와 `LoadingStatus` |
| 결과 | 아래 "결과 화면 구성" |
| 추천 없음 | 두 묶음 모두 탭이 없을 때. 다람쥐(`mascot.retry`), `StatusMessage`(`info`), 재료 수정하기 버튼 |
| 오류 | 후보 요청이나 계산이 실패했을 때. 다람쥐(`mascot.retry`), `StatusMessage`(`error`), 다시 찾기와 재료 수정하기 버튼 |

화면이 보일 때마다 저장소의 입력으로 한 번 계산한다. 요리 찾기, 브라우저 뒤로가기·앞으로가기 어느 쪽으로 들어와도 같다. 다시 찾기는 같은 입력으로 다시 계산한다. 어느 상태에서도 저장소를 바꾸지 않는다.

`cacheComponents`가 켜져 있어 Next.js는 떠난 화면을 지우지 않고 React `<Activity>`로 숨겨 둔다. 그대로 두면 재료 수정에서 다시 요리 찾기를 눌렀을 때 이전 결과가 먼저 보였다가 바뀐다. 그래서 `ResultsScreen`은 숨겨질 때(`useLayoutEffect` cleanup) 계산하는 화면의 `key`를 바꿔 새로 그려 둔다. 다시 보이면 계산 중부터 시작한다. 계산하는 화면은 저장소를 구독하므로, 숨겨진 사이 바뀐 입력으로 계산한다.

## 계산

`searchMeals(inventory, servings, ingredients, signal)`이 다음을 한다.

1. `fetchCandidates`로 후보를 받는다.
2. Worker(`model/find-meal-options.worker.ts`)에 재고, 인분, 후보, 재료를 보내 `findMealOptions`를 돌린다. Worker는 `new Worker(new URL('./find-meal-options.worker.ts', import.meta.url))`로 만든다. Turbopack이 지원하는 형태다.
3. `{ candidates, options: Record<Mode, Comparison> }`를 돌려준다.

- `Worker`가 없는 환경(jsdom 테스트)에서는 같은 함수를 바로 부른다.
- `signal`이 끊기면 요청을 끊고 Worker를 끝낸다(`terminate`). 계산마다 Worker를 새로 만들고 끝나면 닫는다.
- 화면은 `withMinDuration`으로 감싸 2.4초 동안 계산 중을 보여 준다. 실패도 같은 시간을 기다린다.
- 화면은 계산마다 번호를 붙이고, 마지막 번호의 결과만 반영한다. 새 계산을 시작하면 이전 계산을 `abort`한다. 화면을 떠나도 `abort`한다.
- 계산 중에는 다시 찾기 버튼이 화면에 없으므로 같은 요청이 겹치지 않는다. 오류 화면의 다시 찾기는 누르면 바로 계산 중으로 바뀐다.

## 계산 중

`LoadingStatus`에 `copy.loading.announcement`를 화면 읽기 안내로 넘긴다. 문구는 고정 문구와 재료명 문구(`copy.loading.ingredientPhrase`)를 번갈아 넣는다. 재료명은 담은 순서로 앞에서 세 개까지 쓴다. 첫 문구는 고정 문구다.

## 결과 화면 구성

위에서 아래로 다음 순서로 둔다. Light 배경이다.

1. `AppHeader`. 뒤로가기 버튼에 "재료 수정" 글자와 왼쪽 화살표를 둔다. `AppHeader`에 `backLabel`을 더해, 있으면 아이콘과 글자를 함께 보여 주는 Ghost 버튼으로 그린다. 앱 안 기록이 있으면 `router.back()`, 없으면 `/ingredients`로 간다.
2. 제목(`font-display`), 다람쥐(`mascot.meal`), 인분("각 요리 {인분}인분 기준", 16px). 제목 `h1`은 `tabIndex={-1}`이다.
3. 조금 사는 묶음 안내. 사지 않는 묶음이 없어 조금 사는 묶음을 보여 줄 때 `StatusMessage`(`info`)로 이유를 쓴다. 조금 사는 묶음을 고른 경우에는 "사지 않는 요리 보기" 버튼(Secondary)을 둔다.
4. 가짓수 라벨과 탭, 바로 아래 탭 패널. 패널 안에 요약과 요리 카드 목록이 있다.
5. 조금 사는 묶음 제안 카드.
6. 양 추정 안내(14px, Muted).

### 제목

| 경우 | 제목 |
| --- | --- |
| 조금 사는 묶음 | `copy.results.titleWithPurchase` |
| 사지 않는 묶음이고 남는 재료가 없다 | `copy.results.titleAllUsed` |
| 그 밖 | `copy.results.title` |

남는 재료는 지금 탭의 결과로 판단한다. 탭을 바꾸면 제목도 바뀔 수 있다.

## 가짓수 탭

`shared/ui/tabs.tsx`에 Radix Tabs를 감싼 `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`를 둔다. Radix가 방향키, Home, End 이동과 `aria-controls` 연결을 맡는다. 탭 목록은 "몇 가지 요리를 만들까요?" label과 `aria-labelledby`로 잇는다.

- 탭은 지금 묶음의 `Comparison.options`다. 글자는 "{dishes}가지"이고 값은 `dishes`다. `compare`가 남는 양 점수가 줄지 않는 결과와 `partial`로 겹치는 결과를 이미 뺐다.
- 고른 탭은 Ink 면, Light 글자, 체크다(`docs/design.md` "컴포넌트 상태"). 탭이 하나여도 탭 목록을 그린다.
- 처음과 묶음을 바꿀 때 `options[best]`를 고른다. `best`는 가짓수가 가장 많은 탭이다.
- 탭 패널은 탭 바로 아래에 있고 요약과 요리 카드를 담는다. 탭을 바꾸면 패널 첫머리의 요약이 바뀌므로 탭 가까이에서 바뀐 것을 볼 수 있다.

## 요약

`widgets/result-summary`의 `ResultSummary`. 결과, 재료 표, 단위 표, 사용량 시트를 여는 함수를 받는다. Primary 면 카드다.

`splitLeftovers(result.leftovers)`가 `leftGrams`가 `USED_UP_GRAMS`(1g) 미만이면 다 쓴 재료로, 나머지를 남는 재료로 나눈다. 다 쓴 재료는 `leftovers` 순서(담은 순서), 남는 재료는 `leftGrams / startGrams`가 큰 순서다.

- "다 써요 {개수}개"와 재료 이름을 쉼표로 이어 쓴다. 다 쓴 재료가 없으면 이 줄을 두지 않는다.
- "남아요 {개수}개"와 "재료 이름 양"을 쉼표로 이어 쓴다. 양은 `formatAmount(ingredient, leftGrams, 단위)`다. 남는 재료가 없으면 "남는 재료 없음"을 쓴다.
- `leftoverRatio`는 쓰지 않는다.
- "재료별 사용량 보기" 버튼(Secondary, 오른쪽 화살표)에 `data-sheet-opener="usage"`를 달고 사용량 시트를 연다.

## 요리 카드

`widgets/meal-list`의 `MealList`. 결과, 후보 레시피 표, 재료 표, 단위 표, 카드를 눌렀을 때 부를 함수를 받는다.

- `meals`를 `day` 오름차순으로 복사해 정렬한다. 탭이나 묶음이 바뀌면 그 결과의 `day`로 다시 정렬한다.
- 목록은 `<ol>` 하나이고, 요리마다 Ink 선 카드를 8px 간격으로 둔다. 고를 수 있는 후보처럼 보이지 않게 체크나 선택 표시를 두지 않고, 순서 번호와 배분색으로 한 묶음의 요리라는 것을 보여 준다.
- 요리 하나는 전체가 버튼이다. 오른쪽에 화살표 아이콘을 둔다. `data-sheet-opener={`recipe-${meal.recipeId}`}`를 단다.

카드 안은 위에서 아래로 다음과 같다.

| 항목 | 표시 |
| --- | --- |
| 순서 | "{day}번째 요리". 앞에 `allocation.{day}` 색 원과 번호를 둔다. 사용량 시트와 같은 색이다 |
| 순서 이유 | `urgency`가 "빨리 상함"일 때만 "빨리 상하는 {재료}부터 써요". 재료는 `urgentIngredients`를 쉼표로 잇는다 |
| 이름, 조리 시간 | `Meal.name`(SUIT 20px 600), 후보 레시피의 `cookingTime`(14px). 후보에서 찾지 못하면 시간을 쓰지 않는다 |
| 가진 재료 그림 | 가진 재료의 `IngredientImage`를 32px로 나란히 둔다. 대체 텍스트는 비운다 |
| 가진 재료와 양 | `meal.uses` 중 `toBuy`에 없는 재료. "재료 이름 양"을 " · "로 잇는다. 양은 `formatAmount(ingredient, grams, 단위)` |
| 사야 하는 재료 | `mealPurchases`의 `required`. 한 줄로 "따로 사야 해요: {재료와 양}"이고, 재료가 여럿이면 "재료 양"을 쉼표로 잇는다. 양은 `formatAmount(ingredient, grams, ingredient.inputUnits[0], { withGrams: true })`. 장바구니 아이콘과 굵은 글자로 다른 재료와 구분한다 |
| 있으면 좋은 재료 | `mealPurchases`의 `optional`. "있으면 좋음: {재료}". 양을 쓰지 않는다 |
| 필요한 특수 양념 | `meal.pantryNeeded`가 있을 때 "필요한 양념: {양념}" |

있으면 좋은 재료는 사용자가 조금 가진 고명일 수 있다. 그래서 가진 재료 줄에 넣지 않고 "있으면 좋음"에만 둔다. 세션 E의 상세 시트도 같은 규칙으로 나눈다.

## 조금 사는 묶음

화면은 지금 묶음(`noBuy`, `buy`)과 고른 탭을 상태로 갖는다.

- 처음 묶음은 `noBuy`다. `noBuy` 탭이 없고 `buy` 탭이 있으면 `buy`로 시작하고 위에 `copy.purchaseMode.noPurchaseUnavailable`을 안내한다. 이때는 "사지 않는 요리 보기" 버튼을 두지 않는다.
- `shouldSuggestBuy(noBuy, buy)`가 참이고 `noBuy`를 볼 때 요리 목록 아래에 제안 카드를 둔다. 제목 "조금 사서 더 써 볼까요?"와 버튼 "조금 사는 요리 보기"(주요)만 둔다.
- `shouldSuggestBuy`는 `buy`에 탭이 있고, `buy`의 가장 덜 남는 결과(`options[best]`)에 `optional`이 아닌 장보기가 하나 이상 있고, 그 `leftoverScore`가 `noBuy`의 가장 덜 남는 결과보다 작을 때(차이 1e-6 초과) 참이다. `noBuy`에 탭이 없을 때는 쓰지 않는다.
- 묶음을 바꾸면 그 묶음의 `options[best]` 탭을 고른다. 버튼이 사라지므로 포커스를 제목으로 옮기고 화면 맨 위로 스크롤한다.

## 사용량 시트

`widgets/usage-sheet`의 `UsageSheet`와 시트 이름 `USAGE_SHEET = 'usage'`. 공통 `BottomSheet`를 그대로 쓰고, 열기와 닫기는 `_pages/results`가 `useSheetRoute(USAGE_SHEET)`로 맡는다. 시트의 키보드 대응(`visualViewport`)은 건드리지 않는다.

제목 "재료별 사용량", 설명은 시트 설명(`description`)으로 둔다. 본문은 재료마다 한 줄이다.

`allocateStock(result)`이 `leftovers`의 재료마다 다음을 돌려준다.

```ts
type StockAllocation = {
  ingredientId: string;
  startGrams: number;
  leftGrams: number;
  parts: { day: number; recipeId: number; name: string; grams: number }[]; // day 순서
};
```

- `parts`는 그 재료를 쓰는 요리의 가진 양 사용분이다. 사는 재료와 양념은 넣지 않는다.
- 고명이 가진 양보다 많아 산 양이 있으면, 고명이 아닌 분량으로 쓰는 요리의 양을 먼저 넣고, 남은 가진 양을 고명으로 쓰는 요리에 `day` 순서로 나눈다. 그래서 `parts`의 합과 `leftGrams`를 더하면 `startGrams`가 된다(소수 한 자리 반올림 차이까지).
- 줄 순서는 `splitLeftovers`와 같다. 남는 비율이 큰 재료부터, 다 쓴 재료는 맨 뒤다.

한 줄은 다음과 같다.

- 머리: 재료 이름과 "{양} 남아요" 또는 "다 써요". 양은 사용자가 고른 단위다.
- 누적 막대: 높이 24px, Ink 선. 조각마다 `allocation.{day}` 색, 남는 양은 Light 빈 면이다. 폭은 `grams / startGrams` 비율이고 최소 폭을 두지 않는다. 막대는 `aria-hidden`이다. 같은 정보를 펼침 내역이 글자로 준다.
- 펼침 내역: `Collapsible`. 펼치는 버튼은 줄 머리 전체이고 높이는 44px 이상이다. 펼치면 요리마다 색 원과 번호, "{day}번째 요리", 요리 이름, 양을 쓴다. 남는 양이 있으면 마지막에 빈 원과 "{양} 남아요"를 쓴다.
- `amountsReconcile(ingredient, 단위, parts의 g, startGrams)`가 `false`면 내역 아래에 "표시는 반올림한 값이라 합이 다를 수 있어요."를 쓴다.

시트는 지금 묶음과 탭의 결과를 그린다. 시트를 열고 있는 동안에는 묶음과 탭을 바꿀 수 없다.

## 레시피 상세 시트 열기

- 시트 이름은 `'recipe-detail'`이다. 세션 E가 위젯 공개 API로 `RECIPE_DETAIL_SHEET`를 내보낼 때까지 `_pages/results/model/sheets.ts`에 같은 값을 임시로 둔다. 바꾸는 일은 세션 E가 맡는다.
- `_pages/results`가 `useSheetRoute`를 한 번만 부르고, 연 요리의 `recipeId`를 상태로 갖는다. 카드를 누르면 `setRecipeId(meal.recipeId)` 다음 `openSheet(event.currentTarget)`를 부른다.
- 세션 E가 끼울 위젯은 `open`, `onOpenChange`, `meal`(지금 결과에서 `recipeId`로 찾은 요리, 없으면 `null`), `recipe`(후보에서 찾은 레시피), `shoppingList`, `ingredients`(`Ingredient[]`), `units`(`Record<string, InputUnit>`)를 받는다. 이 화면은 이 값을 모두 상태와 props로 갖고 있게 만든다.

## 추천 없음과 오류

다람쥐(`mascot.retry`)를 위에 두고 아래에 `StatusMessage`를 둔다. 안내 글이 같은 뜻을 전하므로 다람쥐의 대체 텍스트는 비운다.

| 상태 | 제목, 설명 | 버튼 |
| --- | --- | --- |
| 추천 없음 | `recovery.emptyTitle`, `recovery.emptyDescription` | 재료 수정하기(주요) |
| 오류 | `recovery.errorTitle`, `recovery.errorDescription` | 다시 찾기(주요), 재료 수정하기(Secondary) |

재료 수정하기는 머리글 뒤로가기와 같은 동작이다. 앱 안 기록이 있으면 뒤로, 없으면 `/ingredients`로 간다.

## 문구

`src/shared/copy/index.ts`의 `loading`, `results`, `mealCard`, `purchaseMode`, `recovery`, `usageSheet`를 쓴다. 다음 키만 더하고 `docs/copy.md`에도 같은 줄을 더한다.

| 키 | 문구 | 자리 |
| --- | --- | --- |
| `mealCard.cookingTime(time)` | 조리 {시간} | 요리 카드의 조리 시간. `cookingTime`이 "60분"처럼 오므로 앞에 붙인다 |

목록의 구분자(쉼표, " · ")는 문구가 아니라 코드에 둔다.

## 문서 반영

| 문서 | 고칠 곳 |
| --- | --- |
| `docs/copy.md` | 위 "문구"의 한 줄 |
| `docs/requirements/results.md` | 조금 사는 묶음 제안을 보여 주는 조건, 묶음을 바꿀 때 고르는 탭, 사용량 시트 순서가 비율 순이라는 것 |
| `docs/architecture.md` | `find-meals`가 Worker로 계산한다는 것 |

## 테스트

- `mealPurchases`: 사야 하는 재료와 있으면 좋은 재료를 `toBuy` 순서로 나눈다.
- `splitLeftovers`: 0.9g은 다 씀, 1g은 남음, 남는 재료는 비율 순서.
- `allocateStock`: 요리마다 쓰는 양이 `day` 순서이고, 고명을 산 경우에도 `parts` 합과 `leftGrams`가 `startGrams`와 같다. 실제 데이터가 있으면 기존 테스트 바구니로 모든 재료를 확인한다.
- `shouldSuggestBuy`: `buy`가 비었을 때, 고명만 살 때, 점수가 같을 때 거짓이고, 덜 남을 때 참이다.
- `searchMeals`: `Worker`가 없을 때 바로 계산하고, `abort`하면 거절한다.
- 결과 화면(jsdom, `searchMeals` 모의): 입력이 없으면 `/`로 보낸다. `<Activity>`로 숨겼다 보이면 이전 결과 없이 계산 중부터 시작하고 그때의 입력으로 다시 계산한다. 늦게 온 이전 응답이 새 결과를 덮지 않는다. 오류에서 다시 찾기가 같은 입력으로 다시 요청한다. 두 묶음 모두 비면 추천 없음을 보여 준다. 사지 않는 묶음이 비면 조금 사는 묶음과 안내를 보여 준다.
- 요리 카드(jsdom): `day` 순서, 순서 이유는 빨리 상함일 때만, 사야 하는 재료 양과 g.

## 화면 확인

`npm run build && npm run start`로 띄우고, 재료 입력 화면에서 실제로 재료를 담아 요리 찾기로 들어와 확인한다.

- 요구사항 문서의 확인 기준
- 재료 1개, 재료 4개(두부·계란·대파·애호박), 재료 13개 바구니로 탭 구성, 제안 카드, 조금 사는 묶음 전환
- 서버를 멈추거나 개발자 도구로 요청을 막아 오류 화면과 다시 찾기
- 360px, 390px 폭에서 긴 요리명, 재료 이름, 양이 넘치거나 잘리지 않는지
- 키보드만으로 탭 이동, 사용량 시트 열고 닫기, 카드로 포커스 복귀
- 동작 줄이기에서 스피너가 멈추고 시트와 펼침이 0ms인지

## 하지 않는 것

- 레시피 상세 시트 위젯과 그 연결. 세션 E가 만든다.
- 결과 저장, 요리 하나만 바꾸기, 구매 단위 표시, 요리별 "여기까지 하면 남는 양"

## 완료 기준

- `docs/requirements/results.md`의 확인 기준을 지킨다. 레시피 상세를 열고 닫는 확인은 세션 E가 위젯을 끼운 뒤에 한다.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`가 통과한다.
- `fsd-review`에서 층 위반이 없다.
