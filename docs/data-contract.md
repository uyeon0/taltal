# 데이터 계약

앱이 읽는 데이터의 형태, 서버 API, 추천 함수, 처리 규칙을 정한다. 코드의 위치는 `docs/architecture.md`를 따르고, 코드의 타입은 이 문서와 같게 유지한다.

## 데이터 전제

앱은 빌드 결과로 나온 JSON을 읽기만 한다. 앱 코드에서 데이터 파일을 고치거나 재료명을 정규화하지 않는다. 필드를 추가해야 하거나 이름을 바꾸거나 지워야 하면 사용자에게 확인한다.

| 파일 | 내용 |
| --- | --- |
| `ingredients.json` | 입력할 수 있는 재료와 양념, 단위별 g |
| `recipes.json` | 추천에 쓰는 레시피와 1인분 재료 g |
| `recipe-steps.json` | 레시피별 요약과 조리 과정 |

서버는 `data/app/`에서 파일을 읽는다. `APP_DATA_DIR` 환경 변수를 지정하면 그 폴더에서 읽는다. 파일이 없으면 API가 500 오류를 돌려준다.

입력할 수 있는 재료의 g 값은 모두 AI 추정치다(`gramsSource: "AI 추정"`). 그래서 환산한 양은 정확한 값처럼 표시하지 않는다.

레시피는 양념을 뺀 재료가 모두 g으로 환산되는 것만 들어 있다. 양념장, 떡, 한과, 음료, 빵, 과자는 한 가지 요리로 추천하기 어색해서 뺐다.

## 재료

```ts
const INPUT_UNITS = ["g", "개", "봉지", "장", "단", "마리", "포기", "팩", "대", "줄", "모", "공기", "뿌리", "통"] as const;
type InputUnit = (typeof INPUT_UNITS)[number];

type Ingredient = {
  id: string;             // 표준명
  aliases: string[];      // 검색에 쓰는 다른 이름
  pantry: "기본" | "특수" | null;
  unitGrams: Partial<Record<InputUnit, number>>; // 입력 단위 → g. 양념은 빈 객체
  inputUnits: InputUnit[]; // 화면 입력 단위. 첫 값이 기본, 마지막은 늘 "g". 양념은 빈 배열
  gramsSource: "AI 추정" | "마트 라벨" | null;
  perishability?: "빨리 상함" | "보통" | "오래 감" | null; // 양념은 null
};
```

- `pantry`가 `null`인 재료만 사용자가 입력한다. 양념은 레시피에 나오는 이름을 보여 주려고 들어 있다.
- `pantry`가 `"기본"`인 양념은 있다고 보고, `"특수"`인 양념은 요리에 필요하다고 보여 준다.
- 양념이 아닌 재료의 `unitGrams`에는 `"g": 1`이 늘 들어 있고, 키는 `inputUnits`의 단위와 같다.
- `inputUnits`가 `["g"]`뿐인 재료는 g으로만 입력한다.
- 타입만으로는 JSON의 값을 검사하지 못한다. 테스트로 실제 데이터의 단위가 `INPUT_UNITS` 안에 있는지 확인한다. 데이터에 새 단위가 생기면 `INPUT_UNITS`도 고친다.
- `gramsSource`는 재료의 단위 중 하나라도 AI 추정이면 `"AI 추정"`이다.

## 레시피

```ts
type Recipe = {
  id: number;
  name: string;
  type: string;           // 예: 밥, 국, 볶음
  cookingTime: string;    // 원문. 예: "60분"
  level: string;
  servingsOriginal: number; // 원문의 인분
  ingredients: RecipeIngredient[];
};

type RecipeIngredient = {
  ingredientId: string;   // Ingredient.id
  grams: number | null;   // 1인분 g. 양념이면 null
  vague: boolean;         // 분량이 "약간", "조금", "적당량"뿐인 고명이면 true. 양념은 false
  amountText: string;     // 원문 분량. 화면 표시용
  role: "주재료" | "부재료" | "양념";
};

type RecipeDetail = {
  id: number;
  summary: string;
  steps: { no: number; text: string; tip: string | null }[];
};
```

한 레시피에는 같은 `ingredientId`가 한 줄만 있다. 원문에 두 줄이면 `grams`를 합친 값이 들어 있다. 조리 과정에 사진은 없다.

## 서버 API

| 요청 | 본문 | 성공 응답 | 실패 |
| --- | --- | --- | --- |
| `POST /api/candidates` | `{ inventory: Stock[], servings: number }` | `{ candidates: Recipe[] }` | 형식이 틀리면 400, 앱 데이터가 없거나 서버 오류면 500 |
| `GET /api/recipes/[id]` | 없음 | `RecipeDetail` | 번호가 숫자로만 되어 있지 않으면 400, 레시피가 없으면 404, 앱 데이터가 없거나 서버 오류면 500 |

`servings`는 1 이상 10 이하의 정수만 받는다. `inventory`는 200개까지, `ingredientId`는 50자까지 받는다. 화면은 1~4를 보낸다. 실패 응답의 본문은 `{ error: string }`이다.

## 추천 함수

`features/find-meals`에 있다. 후보 고르기는 서버에서, 묶음 고르기는 브라우저에서 실행한다.

```ts
// 서버: 묶음 탐색에 넣을 후보를 최대 30개 고른다
function filterCandidates(recipes: Recipe[], inventory: Stock[], servings: number, maxPurchases = 3): Recipe[];

// 브라우저: 후보에서 요리 묶음을 고른다
function recommend(
  inventory: Stock[],
  options: { meals: number; servings: number; maxPurchases?: number },
  data: { candidates: Recipe[]; ingredients: Ingredient[] },
): Result;

type Stock = { ingredientId: string; grams: number };

type Result = {
  status: "ok" | "partial" | "empty";
  meals: Meal[];
  shoppingList: { ingredientId: string; grams: number; optional: boolean }[]; // 묶음 전체에서 모자라는 양
  leftovers: Leftover[];
  leftoverRatio: number;  // 남은 g 합 / 처음 g 합. 0~1
  leftoverScore: number;  // 남는 양 점수. 묶음 고르기와 3·4·5가지 비교에 쓴다. 작을수록 덜 남는다
};

type Meal = {
  recipeId: number;
  name: string;
  uses: { ingredientId: string; grams: number }[]; // 이 요리에 쓰는 양. servings를 곱한 값
  toBuy: string[];        // uses 중 shoppingList에 있는 재료 id
  pantryNeeded: string[]; // 이 레시피에 필요한 특수 양념 id
  day: number;            // 요리 순서. 1부터 시작
  urgency: "빨리 상함" | "보통" | "오래 감" | null; // 이 요리가 쓰는 가진 재료 중 가장 빨리 상하는 등급
  urgentIngredients: string[]; // 그 등급인 가진 재료 id
};

type Leftover = { ingredientId: string; startGrams: number; leftGrams: number };
```

- `options.meals`는 요리 가짓수로 3~5다. `options.servings`는 요리 하나의 인분이다.
- 코드 이름 `meals`, `Meal`, `day`는 그대로 쓴다. 화면에서는 "N가지 요리", "N번째 요리"로 부른다.
- 화면은 사용자가 고른 수량에 `unitGrams`의 단위 값을 곱해 `Stock.grams`를 만든다.
- 사지 않는 묶음은 `maxPurchases: 0`으로, 조금 사는 묶음은 기본값 3으로 구한다. 둘 다 같은 후보를 쓴다.

| `status` | 뜻 |
| --- | --- |
| `ok` | `meals` 수가 요청한 수와 같다 |
| `partial` | 요청보다 적은 요리를 찾았다 |
| `empty` | 만들 수 있는 레시피가 없다 |

## 처리 규칙

### 재료 차감

- 레시피의 `grams`에 `servings`를 곱해 사용량을 구한다. 차감은 고른 레시피들의 사용량 합으로 판단한다.
- 가진 재료는 가진 양까지만 쓴다. 합이 재고를 넘는 묶음은 고르지 않고, 가진 재료를 장보기에 넣지 않는다.
- 없는 재료는 `shoppingList`에 넣는다.
- 양념은 차감하지 않고 `leftovers`와 `leftoverRatio`에서 뺀다.

### 묶음 고르기

- `meals`개짜리 묶음을 모두 살펴 남는 양 점수가 가장 낮은 묶음을 고른다. 점수가 같으면 사는 g이 적은 묶음을 고른다.
- 남는 양 점수는 재료마다 남은 비율에 보관 등급 가중치를 곱해 더한 값이다. 가중치는 빨리 상함 3, 보통 1.5, 오래 감 1이다. g 합으로 세면 무거운 재료만 줄이고 가벼운 채소를 남기는 묶음이 뽑히기 때문이다.
- 결과의 `leftoverScore`가 이 점수다. `leftoverRatio`는 점수와 다른 값이다. 빨리 상하는 채소를 쓰는 대신 무거운 재료가 남아 `leftoverRatio`가 높게 나올 수 있다.
- 비율과 점수는 반올림하기 전 g으로 구한다. `leftovers`의 g은 소수 한 자리로 반올림한 값이다.
- 묶음 하나에서 사는 재료는 `maxPurchases`가지 이하이고, 각 레시피는 가진 재료를 고명이 아닌 분량으로 하나 이상 쓴다. 냉장고가 비어 있을 때 전부 사서 만드는 묶음이 나오지 않게 하려는 규칙이다.
- 고명은 없어도 되는 재료라 사는 재료 수에 세지 않고, 모자라면 `optional: true`로 넣는다.
- `meals`개를 만들 수 없으면 하나씩 줄여 다시 찾고 `status`를 `partial`로 둔다.

### 후보 고르기

`filterCandidates`는 가진 재료를 고명이 아닌 분량으로 하나 이상 쓰고, 가진 재료를 가진 양 안에서 쓰고, 혼자서도 `maxPurchases`가지를 넘게 사지 않는 레시피만 남긴다. 사야 할 g이 적은 순서로 정렬하고, 같으면 사는 재료 수가 적은 순서, 그다음 가진 재료를 많이 쓰는 순서로 정렬한다. 사지 않아도 되는 레시피가 앞에 오므로 `maxPurchases: 0`에도 같은 후보를 쓸 수 있다.

### 요리 순서

- 가진 재료 중 가장 빨리 상하는 등급이 높은 요리가 먼저다. 등급이 같으면 그 등급 재료를 쓰는 g이 많은 요리가, 그래도 같으면 `meals` 순서가 먼저다.
- 산 재료는 사 온 뒤에 쓰므로 등급을 따질 때 세지 않는다.
- 가진 재료의 등급이 없으면 `urgency`는 `null`이고 맨 뒤로 간다.
- `recommend`는 `meals` 배열 순서를 바꾸지 않는다. 화면이 `day`로 정렬한다. 순서는 묶음을 고르는 규칙에 영향을 주지 않는다.

### 3·4·5가지 비교

가짓수를 늘려도 남는 양 점수가 오를 수 있다. 가진 재료를 대부분 쓴 뒤 요리를 더 넣으면 구매 한도 안에서 만들 수 있는 레시피가 부족해 덜 쓰는 묶음으로 바뀌기 때문이다. 화면은 가짓수가 더 많은데 남는 양 점수(`leftoverScore`)가 줄지 않는 결과를 보여 주지 않는다. `leftoverRatio`로 비교하지 않는 이유는 빨리 상하는 채소를 다 쓰는 묶음이 g 비율로는 더 남아 보여 숨겨질 수 있어서다.

## 양 표기

g을 화면 수량으로 바꿀 때는 `entities/ingredient`의 `formatAmount`를 쓴다. 규칙은 `docs/design.md`의 "잔량·수량 표기 규칙"을 따른다.
