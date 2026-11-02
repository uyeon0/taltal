# 레시피 상세 시트

결과 화면의 요리 카드에서 여는 레시피 상세 시트(`widgets/recipe-detail-sheet`)를 만든다. 시트는 결과 화면이 넘겨준 요리와 레시피로 제목과 재료를 바로 그리고, 요약과 만드는 법은 열 때 `GET /api/recipes/[id]`로 받는다. 결과 화면(`_pages/results`)과 요리 카드(`widgets/meal-list`)는 세션 D가 만든다. 이 작업은 결과 화면 PR이 머지되기 전에는 그 파일을 고치지 않고, 머지된 뒤 시트를 끼우는 자리만 고친다.

- 이슈: #8 레시피 상세 시트
- 기준 문서: `docs/requirements/recipe-detail.md`, `docs/requirements/foundation.md`의 "바텀시트", `docs/requirements/results.md`의 "요리 카드", `docs/data-contract.md`, `docs/design.md`, `docs/copy.md`, `docs/architecture.md`
- 배치 참고: `docs/wireframes/recipe-results-wireframe.html`의 상세 시트. 문구, 수치, 색은 참고하지 않는다
- 브랜치: `feat/recipe-detail`(`main`의 `8390c37`에서 분기한 뒤 결과 화면 PR #17이 머지된 `dd35d7a`를 받았다)

## 사용자와 정한 것

| 항목 | 결정 |
| --- | --- |
| 세 무리의 소제목 문구 | "가진 재료", "따로 사야 해요", "양념 · 원문 {인분}인분 기준". 요리 카드의 "따로 사야 해요: {재료와 양}"과 맞춘다. 시트는 이 소제목 아래에 재료마다 한 줄씩 쓰므로 `copy.mealCard.toBuy`는 쓰지 않는다. `docs/copy.md`의 "레시피 상세 시트"와 `shared/copy`에 더한다 |
| 있으면 좋은 재료(고명)의 자리 | "따로 사야 해요" 무리 안 아래쪽에 양 없이 이름과 "있으면 좋음"을 쓴다. 무리는 요구사항대로 셋이다 |
| `mealPurchases`를 쓰는 시점 | 이 브랜치에 따로 두지 않고 결과 화면 PR이 머지된 `main`의 것을 쓴다 |

## 세션 D와 맞춘 것

| 항목 | 정한 내용 |
| --- | --- |
| 시트 이름 | `RECIPE_DETAIL_SHEET = "recipe-detail"`. 이 widget의 공개 API로 내보낸다. 주소는 `/results?sheet=recipe-detail`이다 |
| 여는 쪽 | `_pages/results`가 `useSheetRoute(RECIPE_DETAIL_SHEET)`를 한 번만 부르고, 연 요리의 `recipeId`를 React 상태로 갖는다. widget 안에서는 훅을 부르지 않는다 |
| 포커스 복귀 | 요리 카드 버튼에 `data-sheet-opener="recipe-{recipeId}"`를 단다 |
| 사는 재료 나누기 | 세션 D가 `features/find-meals`에 `mealPurchases`를 더하고 카드와 시트가 함께 쓴다 |
| 연결 | 결과 화면 PR이 먼저 머지됐으므로 이 브랜치가 `_pages/results`에 시트를 끼운다 |

같은 이름으로 `useSheetRoute`를 두 군데서 부르면 연 버튼을 기억한 쪽과 닫힘을 처리하는 쪽이 갈려 포커스가 돌아가지 않는다. 그래서 재료 선택 시트처럼 화면이 훅을 갖고 widget은 `open`과 `onOpenChange`만 받는다. 탭이나 묶음을 바꿔 카드가 다시 그려져도 `data-sheet-opener`로 같은 요리 카드에 포커스가 돌아가고, 그 카드가 없으면 뒤로가기 버튼으로 간다. `useSheetRoute`의 기존 규칙이므로 훅은 고치지 않는다.

`mealPurchases`의 시그니처는 다음과 같다.

```ts
// features/find-meals/model/purchases.ts
export function mealPurchases(
  meal: Meal,
  shoppingList: Result['shoppingList']
): { required: { ingredientId: string; grams: number }[]; optional: string[] };
```

- `required`: `meal.toBuy` 중 `shoppingList`에서 `optional`이 `false`인 재료. `grams`는 `meal.uses`의 그 요리 사용량이다.
- `optional`: `meal.toBuy` 중 `optional`이 `true`인 재료 id. 사용자가 조금 가진 고명도 여기에 들어간다.
- 순서는 `meal.toBuy` 순서를 유지한다.

## 결과 화면에 끼우기

`src/_pages/results/ui/results-view.tsx`는 이미 `useSheetRoute(RECIPE_DETAIL_SHEET)`를 `recipeSheet`로 부르고, 카드를 누르면 `setRecipeId(meal.recipeId)` 뒤에 `recipeSheet.openSheet(opener)`를 부른다. 연 요리 id는 `const [, setRecipeId] = useState<number | null>(null)`로 값을 버리고 있다. 이 파일을 다음처럼 고친다.

- `recipeId` 값을 꺼내 `RecipeDetailSheet`를 그린다. `open`과 `onOpenChange`는 `recipeSheet`의 값이다.
- `meal`은 지금 탭의 `result.meals`에서 `recipeId`로 찾고, 없으면 `null`이다. `recipe`는 `recipeMap.get(recipeId)`, `shoppingList`는 `result.shoppingList`, `ingredients`와 `units`는 이 화면의 props다.
- 임시 상수 파일 `src/_pages/results/model/sheets.ts`를 지우고 widget의 `RECIPE_DETAIL_SHEET`를 가져온다.

요리 카드의 opener 값은 `widgets/meal-list`의 `mealOpener`가 만드는 `recipe-{recipeId}`다. 결과 화면은 다른 화면으로 갔다 오면 다시 그려지고 결과를 다시 계산한다(`results-screen.tsx`의 visit key). 그때 `recipeId` 상태도 처음 값으로 돌아가므로, 시트가 열린 채 돌아오면 내용이 없는 시트가 될 수 있다. 구현할 때 이 경우를 브라우저에서 확인하고, 문제가 되면 사용자에게 처리 방법을 묻는다.

## 파일

| 파일 | 내용 |
| --- | --- |
| `src/widgets/recipe-detail-sheet/index.ts` | 공개 API. `RecipeDetailSheet`, `RECIPE_DETAIL_SHEET` |
| `src/widgets/recipe-detail-sheet/index.server.ts` | 서버용 공개 API. `toRecipeDetailView`, `RecipeDetailView` |
| `src/widgets/recipe-detail-sheet/model/sheet.ts` | `RECIPE_DETAIL_SHEET` |
| `src/widgets/recipe-detail-sheet/model/group-ingredients.ts` | 레시피 재료를 세 무리로 나누는 순수 함수 |
| `src/widgets/recipe-detail-sheet/model/recipe-detail-view.ts` | 화면에 쓸 값을 모두 만드는 순수 함수 `toRecipeDetailView`와 `RecipeDetailView` 타입 |
| `src/widgets/recipe-detail-sheet/ui/recipe-detail-content.tsx` | `RecipeDetailView`만 받아 레시피 내용을 그리는 컴포넌트 |
| `src/widgets/recipe-detail-sheet/model/use-recipe-detail.ts` | 상세를 받는 훅 |
| `src/widgets/recipe-detail-sheet/ui/recipe-detail-sheet.tsx` | 시트 틀, 불러오기, 로딩과 오류 |
| `src/shared/copy/index.ts` | 이미 있는 `copy.recipeSheet`에 무리 소제목과 "있으면 좋음"을 더한다 |
| `docs/copy.md` | "레시피 상세 시트"에 무리 소제목과 "있으면 좋음"을 더한다 |
| `src/_pages/results/ui/results-view.tsx` | 시트를 끼운다 |
| `src/_pages/results/model/sheets.ts` | 지운다 |

테스트 파일은 각 파일 옆에 둔다. `entities/recipe`의 `fetchRecipeDetail`, `_app/api-routes/recipe-detail.ts`, `app/api/recipes/[id]/route.ts`는 이미 있으므로 고치지 않는다.

## 이미지 내보내기에 대비한 구조

나중에 레시피 상세를 이미지로 저장하는 기능을 붙인다. 이미지는 서버에서 그린다. 이번 작업에서는 내보내기 버튼, 이미지 API, 이미지 라이브러리를 만들지 않는다. `docs/overview.md`의 범위에 없기 때문이다. 대신 그 기능을 붙일 때 시트를 다시 나누지 않도록 다음 원칙을 지킨다.

- 화면에 쓸 값은 `toRecipeDetailView(meal, shoppingList, recipe, detail, ingredients, units)` 하나가 모두 만든다. "N번째 요리", 요리 이름, 조리 시간, 요약, 세 무리의 재료와 양 문자열, 원문 분량, 원문 인분 안내, 만드는 법이 들어간다. 시트와 서버 이미지가 같은 함수를 써서 같은 값을 보여 준다.
- 이 함수는 서버에서도 부를 수 있어야 한다. 시트는 슬라이스 안에서 상대 경로로 쓰고, 슬라이스 밖으로는 `index.server.ts`로만 내보낸다. `features/build-inventory`가 `.server`가 아닌 파일의 타입을 `index.server.ts`로 내보내는 것과 같은 방식이다. 파일에 `'use client'`를 두지 않고, React, DOM, 브라우저 API, 클라이언트 전용 모듈을 import하지 않는다. `.server`도 붙이지 않는다. 입력과 출력은 JSON으로 그대로 보낼 수 있는 값만 쓴다. 요리의 `Meal`과 사용자의 입력 단위는 브라우저에만 있으므로, 나중에 이미지 API는 이 입력을 요청 본문으로 받을 수 있다.
- 서버 이미지는 화면 컴포넌트를 다시 쓰지 않고 `RecipeDetailView`로 따로 그린다. 서버 이미지 렌더러는 화면과 다른 CSS만 지원하기 때문이다. 그래서 화면과 이미지가 공유하는 것은 컴포넌트가 아니라 `RecipeDetailView`다.
- 화면 쪽은 `RecipeDetailContent`가 `RecipeDetailView`만 받아 그린다. 데이터 요청, 시트 상태, 스크롤에 기대지 않는다. 시트 틀, 불러오기, 로딩과 오류는 `RecipeDetailSheet`가 맡는다.
- 상세를 아직 받지 못했으면 `detail`은 `null`이고, `RecipeDetailView`의 요약과 만드는 법도 `null`이다. 시트는 요약 자리에 로딩이나 오류를 한 번 보여 주고, 만드는 법 절은 그리지 않는다.

## props

```ts
type RecipeDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: Meal | null;                   // 지금 보는 묶음에서 연 요리
  recipe: Recipe | null;               // 후보 레시피 중 meal.recipeId인 것
  shoppingList: Result['shoppingList']; // 있으면 좋은 재료를 가르는 데 쓴다
  ingredients: Ingredient[];
  units: Record<string, InputUnit>;     // 재료 id → 사용자가 입력한 단위
};
```

결과 화면은 값을 다음처럼 넘긴다.

- `ingredients`: 서버에서 `getIngredients()`로 받은 전체 목록(양념 포함)
- `units`: `useInventory`의 `items`로 만든 `{ [ingredientId]: unit }`
- `recipe`: `/api/candidates`로 받은 후보에서 `recipeId`로 찾은 것
- `meal`, `shoppingList`: 지금 보는 묶음과 탭의 `Result`

탭이나 묶음이 바뀌어 연 요리가 새 결과에 없으면 시트가 열린 채로 `meal`이 `null`이 된다. widget은 마지막으로 받은 `null`이 아닌 `meal`, `recipe`, `shoppingList`를 상태로 기억해 두고 그 값으로 그린다. 그래서 `meal`이 `null`이 돼도, 닫히는 동작 중에도 내용이 사라지지 않는다. 한 번도 값을 받지 못했으면 본문을 그리지 않는다.

## 시트 구성

`BottomSheet`로 연다. `BottomSheet`의 키보드 대응(`repositionInputs={false}`와 `useVisualViewport`)은 그대로 두고 props만 넘긴다. 이 시트에는 입력칸과 `footer`가 없다.

| 순서 | 자리 | 내용 |
| --- | --- | --- |
| 1 | `title` 위 | "{day}번째 요리". 부가 설명 크기의 SUIT |
| 2 | `title` | `meal.name`. SUIT 24px 700. 시트에서 가장 큰 글자다 |
| 3 | `description` | 요리 카드와 같은 `copy.mealCard.cookingTime(recipe.cookingTime)`. 예: "조리 40분". 카드처럼 14px Ink로 쓴다 |
| 4 | 본문 | 요약(`detail.summary`) |
| 5 | 본문 | 제목 "이 요리에 쓰는 재료"와 세 무리 |
| 6 | 본문 | 제목 "만드는 법"과 단계 목록 |

"N번째 요리"는 `copy.mealCard.order(meal.day)`로 쓴다. 두 문구는 요리 카드와 시작 홈이 함께 쓰므로 읽기만 하고 고치지 않는다. "N번째 요리"에는 배분색을 쓰지 않는다. 시트에는 사용량 막대처럼 색으로 이어 볼 대상이 없고, 요리 카드의 번호 표시는 세션 D의 widget 안에 있어 가져오지 못한다.

"이 요리에 쓰는 재료"와 "만드는 법" 두 절은 위에 시트 폭 전체의 3px Ink 선을 둬서 나눈다. `docs/design.md`의 시각 레퍼런스(Yellowbird) 레시피 페이지가 절을 먹색 선으로 나누는 방식을 따른 것이고, 선은 기본 선 값을 쓴다.

본문 글자의 위계는 다음과 같다. 위 단계일수록 크거나 굵다.

| 단계 | 요소 | 크기, 굵기 |
| --- | --- | --- |
| 절 제목 | "이 요리에 쓰는 재료", "만드는 법" | 20px 600 |
| 무리 소제목 | "가진 재료", "따로 사야 해요", "양념" | 16px 600. 양념 뒤의 "· 원문 N인분 기준"은 14px 500 |
| 본문 | 요약, 재료 이름, 단계 글 | 16px 400 |
| 분량 | 재료 줄의 분량 | 16px 500. 소제목보다 낮춘다 |
| 보조 | "원문 분량 보기" 버튼, 원문 인분 안내, 단계 번호, 팁 | 14px. 버튼과 번호는 600 |

1~3과 재료는 props로 바로 그린다. 4와 6만 응답을 기다린다.

## 재료

`groupIngredients(meal, recipe, shoppingList)`가 `mealPurchases`로 사는 재료를 나누고, `recipe.ingredients`를 원문 순서대로 네 묶음으로 나눈다. 화면에서는 "따로 사야 해요"와 "있으면 좋음"을 한 무리 안에 두므로 요구사항의 세 무리가 된다. 레시피의 모든 재료가 한 묶음에 한 번씩 들어간다.

| 묶음 | 고르는 규칙 | 양 |
| --- | --- | --- |
| 가진 재료 | `meal.uses`에 있고 `meal.toBuy`에 없는 재료 | `formatAmount(ingredient, use.grams, units[id])` |
| 따로 사야 해요 | `mealPurchases`의 `required` | `formatAmount(ingredient, grams, ingredient.inputUnits[0], { withGrams: true })` |
| 있으면 좋음 | `mealPurchases`의 `optional` | 쓰지 않는다 |
| 양념 | `grams`가 `null`인 재료 | `amountText` |

`use`는 `meal.uses`에서 그 재료의 항목이고, 이 요리 하나에 쓰는 양에 인분을 곱한 값이다. 가진 재료와 사야 하는 재료의 양은 요리 카드와 같은 값과 옵션이다(세션 D와 확인).

무리는 `role`이 아니라 `grams`로 나눈다. 데이터에는 `role`이 `"양념"`인데 g이 있는 재료(예: 콩나물밥의 대파 12.5g)와 `"부재료"`인데 g이 없는 재료(예: 오므라이스의 녹말)가 있다. `Meal.uses`는 `grams`가 있는 재료만 담으므로 `grams`로 나눠야 결과 화면의 계산과 맞는다. 지금 데이터에서 `grams`가 `null`인 재료는 모두 `pantry`가 `"기본"`이나 `"특수"`인 양념이다.

- 사용자가 조금 가진 고명이 모자라 `toBuy`에 들어간 경우는 "있으면 좋음"에만 둔다. 요리 카드와 같다.
- 특수 양념(`pantry: "특수"`)에는 따로 표시를 붙이지 않는다. 요리 카드에 "필요한 양념"으로 이미 나오고, 시트에서는 모든 양념의 분량이 보인다.
- 재료 이름 옆에 그림은 두지 않는다. 요구사항에 없고, 시트에서는 분량을 읽는 것이 주된 일이다.

### 원문 분량과 인분 안내

`amountText`는 원문 인분(`recipe.servingsOriginal`) 기준이다. 콩나물밥은 4인분 원문이라 콩나물이 "300g"이고 1인분 g은 75다.

- 가진 재료 무리 아래에 "원문 분량 보기" 접기 버튼(`Collapsible`)을 하나 둔다. 펼치면 가진 재료마다 이름과 `amountText`를 보여 주고, 그 아래에 "원문은 {servingsOriginal}인분 기준이에요."를 쓴다. 처음에는 접혀 있다.
- 양념 무리 소제목은 "양념 · 원문 {servingsOriginal}인분 기준"이다. 소제목 아래에 "원문은 N인분 기준이에요."만 두면 보이는 분량이 고른 인분으로 바꾼 값처럼 읽혀서, 기준을 소제목에 붙인다.
- 사야 하는 재료와 있으면 좋은 재료에는 원문 분량을 붙이지 않는다. 요구사항이 가진 재료에만 정한다.

물과 육수는 데이터에 없으므로 목록에 나오지 않는다. 따로 안내하지 않는다.

## 만드는 법

`detail.steps`를 `no` 오름차순으로 정렬해 `<ol>`로 보여 준다. 화면의 번호는 `no` 값을 쓴다. `tip`이 있으면 그 단계 글 아래에 "팁" 라벨과 함께 붙인다. 사진은 두지 않는다. 지금 데이터는 레시피 151개, 단계는 최대 9개, 팁이 있는 단계는 38개다.

## 불러오기

`useRecipeDetail(recipeId, open)`이 맡는다.

- `open`이 `true`가 되거나 열린 채로 `recipeId`가 바뀌면 `fetchRecipeDetail(recipeId, signal)`을 부른다. 레시피 하나만 요청하고 결과 화면은 미리 받지 않는다.
- 상태는 `loading`, `ready`, `error` 셋이다. 요청을 새로 시작하거나 시트를 닫으면 이전 요청을 `AbortController`로 끊는다. 끊긴 요청의 결과는 상태에 반영하지 않으므로, 늦게 도착한 다른 레시피의 응답이 지금 레시피를 덮지 않는다.
- 받은 상세는 저장하지 않는다. 같은 요리를 다시 열면 다시 요청한다. 오류 문구가 "시트를 닫고 다시 열어 주세요"라서 다시 열면 새로 요청해야 한다.
- `loading`: 요약 자리에 스피너와 "레시피를 불러오고 있어요"를 보여 준다. 시트 안의 짧은 기다림이라 화면 로딩의 최소 2.4초와 바뀌는 문구는 쓰지 않고, `LoadingStatus`에 문구 하나만 넘긴다.
- `error`: 요약 자리에 `StatusMessage tone="error"`로 "레시피를 불러오지 못했어요. 시트를 닫고 다시 열어 주세요."를 보여 준다. 다시 시도 버튼은 두지 않는다. 제목, 조리 시간, 재료는 그대로 보인다.

오류는 시트 안에서만 보이고 결과 화면의 상태와 입력 저장소를 바꾸지 않는다.

## 시트 동작

스크롤, 포커스 복귀, 뒤로가기는 `BottomSheet`와 `useSheetRoute`가 이미 맡으므로 새로 만들지 않는다.

- 본문은 `BottomSheet`의 `overflow-y-auto overscroll-contain` 영역 안에 있어 긴 레시피도 끝까지 스크롤되고 결과 화면으로 넘어가지 않는다.
- 시트를 열면 vaul의 `autoFocus`로 시트 안에 포커스가 들어간다. 닫으면 `useSheetRoute`가 누른 요리 카드로 포커스와 스크롤을 돌려준다.
- 브라우저 뒤로가기는 `?sheet=recipe-detail` 기록을 되돌려 시트를 닫는다.

## 테스트

| 대상 | 확인하는 것 |
| --- | --- |
| `toRecipeDetailView` | 실제 레시피 하나로 만든 값이 시트에 보이는 문자열과 같다. 결과를 `JSON.parse(JSON.stringify(view))`해도 같다. `detail`이 `null`이면 요약과 만드는 법이 `null`이다 |
| `groupIngredients` | 재료가 빠짐없이 한 묶음에만 들어간다. `role`이 양념이어도 g이 있으면 가진 재료나 사야 하는 재료로 간다. 조금 가진 고명이 모자라면 있으면 좋음에만 간다. 원문 순서를 지킨다 |
| `useRecipeDetail` | 열 때 한 번만 요청한다. 닫으면 요청을 끊는다. 다른 레시피로 바뀌면 이전 응답을 버린다. 실패하면 `error`다 |
| `RecipeDetailSheet` | `meal`이 `null`로 바뀌어도 마지막 내용이 남는다. 가진 재료의 양이 `formatAmount`와 입력 단위로 보인다. 양념에 원문 인분 안내가 있다. 원문 분량은 접혀 있다가 펼쳐진다. 응답 실패 시 시트 안에 오류가 보이고 재료는 남아 있다. 단계가 `no` 순서이고 팁이 단계 아래에 붙는다 |
| `_app/api-routes/recipe-detail` | 이미 있는 테스트를 그대로 통과한다 |

실제 데이터로 도는 테스트는 `APP_DATA_DIR`을 쓴다.

## 확인 기준 점검

요구사항의 확인 기준을 다음처럼 확인한다.

| 확인 기준 | 확인 방법 |
| --- | --- |
| 시트를 열 때 그 레시피 하나만 요청한다 | 훅 테스트와 브라우저의 네트워크 기록 |
| 가진 재료의 양이 요리 카드와 같은 단위와 값이다 | 브라우저에서 카드와 시트를 나란히 비교한다 |
| 양념에 원문 인분 안내가 붙어 있다 | 컴포넌트 테스트 |
| 응답이 실패해도 시트 안에서 안내하고, 닫으면 결과 화면이 그대로다 | 컴포넌트 테스트와, 브라우저에서 요청을 막고 열고 닫기 |
| 마지막 요리 카드를 열고 닫은 뒤 같은 카드로 돌아온다 | 브라우저에서 확인한다 |

lint, 타입 검사, 테스트, `fsd-review`를 함께 돌린다.
