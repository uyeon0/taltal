# 재료 입력

사용자가 가진 재료, 양, 단위, 인분을 넣는 화면(`/ingredients`)과 재료 선택 시트를 만든다. 입력은 `features/build-inventory`의 `useInventory`에 담고, 추천 결과 화면이 이 값을 읽는다.

- 이슈: #6 재료 입력 화면
- 기준 문서: `docs/requirements/ingredient-input.md`, `docs/design.md`, `docs/copy.md`, `docs/architecture.md`, `docs/data-contract.md`
- 참고 시안: `docs/wireframes/ingredient-input-wireframe.html`, `integrated-flow-wireframe.html`, `ingredient-input-style-study.html`
- 브랜치: `feat/ingredient-input`

## 사용자와 정한 것

| 항목 | 결정 |
| --- | --- |
| 인분 기본값 | 요구사항 문서대로 2인분이다. `INITIAL_INVENTORY.servings`를 2로 바꾼다 |
| 비활성 이유 문구 | 요리 찾기: "재료를 담으면 요리를 찾을 수 있어요." 담기: "재료를 고르면 담을 수 있어요." `docs/copy.md`와 `shared/copy`에 더한다 |
| g 상한 | 직접 입력한 수량을 g으로 바꾼 값이 10,000,000g을 넘어도 수량 오류를 보여 준다. 서버 API가 재료 하나에 10,000,000g까지만 받기 때문이다. 오류 문구는 바꾸지 않는다 |
| 영수증으로 넣기 | 기능을 빼기로 했다. 준비 중 표시도 두지 않는다 |
| 재료 카드 선택 | 체크로만 구분한다. 선은 고르기 전후 모두 3px Ink, 면은 Light다 |

## 슬라이스와 파일

| 위치 | 담는 것 |
| --- | --- |
| `app/ingredients/page.tsx` | `_pages/ingredients`의 화면을 내보내기만 한다 |
| `_pages/ingredients` | 서버에서 재료 목록을 읽어 화면에 넘기는 서버 컴포넌트, 화면 배치, 펼친 재료 상태, 기본 양념 안내, 아래 고정 주 행동 |
| `widgets/ingredient-list` | 담은 재료 목록, 빈 목록 안내, 재료 한 줄과 펼친 수량 편집 |
| `features/build-inventory` | 입력 상태 저장소(있음), 재료 선택 시트, 수량 편집, 인분 선택, 빠른 수량 계산, 수량 검사와 단위 환산, 검색, 결과 화면에 넘길 `toStocks`, 서버 전용 재료 목록 함수 |

`build-inventory`의 공개 API에 다음을 더한다.

| 내보내는 것 | 파일 | 내용 |
| --- | --- | --- |
| `IngredientPickerSheet` | `ui/ingredient-picker-sheet.tsx` | 재료 선택 시트 |
| `AmountEditor` | `ui/amount-editor.tsx` | 재료 하나의 수량 편집 |
| `ServingsPicker` | `ui/servings-picker.tsx` | 인분 선택기 |
| `INGREDIENT_PICKER_SHEET` | `model/sheet.ts` | 시트 이름 `"ingredient-picker"` |
| `formatQuantity` | `model/format-quantity.ts` | 사용자가 정한 수량을 화면 문자열로 바꾼다 |
| `isInventoryReady`, `toStocks` | `model/to-stocks.ts` | 결과 화면에 넘기는 입력(아래 "결과 화면에 넘기는 입력") |
| `getPickableIngredients` | `api/get-pickable-ingredients.server.ts` | `index.server.ts`로만 내보낸다 |

## 데이터 읽기

`getPickableIngredients()`는 서버에서 `getIngredients()`와 `getRecipes()`를 읽어 다음을 돌려준다.

```ts
type PickableIngredients = {
  pickable: Ingredient[];    // pantry가 null인 재료. 레시피에 나오는 횟수가 많은 순서, 같으면 id 가나다순
  pantryBasics: string[];    // pantry가 "기본"인 재료 id. 가나다순
};
```

레시피에 나오는 횟수는 `Recipe.ingredients`에 그 `ingredientId`가 있는 레시피 수다. 지금 데이터에서 앞의 다섯은 대파 93, 양파 43, 쇠고기 37, 홍고추 36, 계란 31이다. 재료와 레시피 entities는 서로 import하지 않으므로 두 데이터를 합치는 일은 이 feature가 맡는다.

`_pages/ingredients`의 서버 컴포넌트가 이 함수를 부르고 결과를 클라이언트 화면에 props로 넘긴다. 화면은 빌드할 때 정적으로 만들어진다. 재료 63개와 별칭 정도라 브라우저로 보내도 크지 않다. 별도 API는 만들지 않는다.

## 화면

위에서 아래로 다음 순서로 둔다. Light 배경이다.

1. `AppHeader`(`backHref="/"`)
2. 제목 "재료와 양을 알려 주세요". `font-display`, 고정 문구라 낭만있구미체로 쓴다. 지원 글자 목록에 모두 있다
3. 담은 재료 목록(`widgets/ingredient-list`). 비어 있으면 `Mascot pose="discovery"`와 빈 목록 제목, 설명
4. "재료 추가" Secondary 버튼(`data-sheet-opener="ingredient-picker"`)
5. 기본 양념 안내와 접힌 목록
6. 인분 선택(`ServingsPicker`)
7. 화면 아래 고정 주 행동

`useSheetRoute`가 `useSearchParams`를 쓰므로 클라이언트 화면 전체를 `Suspense`로 감싼다.

### 펼친 재료

어떤 재료의 수량 편집을 펼쳤는지(`openId: string | null`)는 화면의 React 상태로 둔다. 저장소에 넣지 않으므로 결과에서 돌아오면 모두 접힌 상태다. 목록, 시트, 주 행동이 함께 바꾸므로 `_pages/ingredients`가 갖고 목록 위젯에 넘긴다.

- 재료 줄을 누르면 그 재료를 펼치고, 펼친 재료를 다시 누르면 접는다. 한 번에 하나만 펼친다.
- 양을 정하면 목록 순서에서 첫 미완료 재료를 펼친다. 없으면 접는다.
- 재료를 지우면 첫 미완료 재료를 펼친다. 없으면 접는다.
- 새로 펼칠 때는 펼친 편집의 제목(`tabIndex={-1}`)으로 포커스를 옮기고 화면 안으로 스크롤한다. 제목 앞에 재료 이름을 `sr-only`로 넣어 화면 읽기 프로그램이 어느 재료인지 읽는다. 편집을 닫으면 방금 정한 재료의 줄 버튼으로 포커스를 옮긴다.

## 재료 선택 시트

`IngredientPickerSheet`는 `BottomSheet`와 `useSheetRoute(INGREDIENT_PICKER_SHEET)`로 연다.

- 검색칸: `Input type="search"`, 보이는 label은 두지 않고 `aria-label`과 placeholder에 "산 재료를 찾아보세요"를 쓴다.
- 격자: 3열. 칸마다 `IngredientImage`(74px 안팎)와 재료 이름. 칸은 `aria-pressed`를 단 버튼이다.
- 고른 칸: 오른쪽 위에 체크 아이콘. 선과 면은 고르기 전과 같다.
- 담긴 칸: `disabled`, 비활성 모습(Light 면, Muted 글자, Subtle 선)에 "담김"을 글자로 붙인다.
- 아래 고정: "{개수}개 담기" 주 버튼. 0개면 비활성이고 버튼 위에 "재료를 고르면 담을 수 있어요."를 둔다.

고른 재료는 시트 컴포넌트의 상태(고른 순서의 id 배열)로 둔다. 시트가 열릴 때 비우고, 검색어가 바뀌어도 유지한다. 닫기, Esc, 막 누르기, 뒤로가기로 닫으면 저장소를 바꾸지 않는다.

담기를 누르면 고른 순서대로 `addItems`에 넣는다. 단위는 각 재료의 `inputUnits[0]`이다. 그다음 `closeSheet()`로 닫고, 새로 담은 재료 중 첫 번째를 펼친다. 포커스는 `useSheetRoute`가 여는 버튼으로 돌려준 뒤 펼친 편집의 제목으로 옮긴다. 두 이동이 같은 프레임에 겹치지 않도록 편집 제목 포커스를 시트가 닫힌 다음 프레임에 둔다.

### 검색

`model/search.ts`의 `matchesQuery(ingredient, query)`가 맡는다. 검색어와 `id`, `aliases`에서 공백을 모두 지운 뒤 포함 여부로 찾는다. "노랑파프리카"로 "노랑 파프리카"를 찾기 위해서다. 검색어가 공백뿐이면 모두 보여 준다.

결과가 없으면 격자 자리에 `"{검색어}"는 목록에 없어요. 다른 이름으로 찾아보세요.`와 "검색어 지우기" 버튼을 둔다. 지우기를 누르면 검색어를 비우고 검색칸으로 포커스를 옮긴다.

### 시작 홈에서 시트를 열고 들어오기

시작 홈의 "직접 고르기"는 `/ingredients?sheet=ingredient-picker`로 간다(세션 B에 알린다). `useSheetRoute`는 주소로 바로 열린 시트를 닫을 때 `replaceState`로 쿼리만 지우므로, 그대로 두면 시트가 열린 상태에서 뒤로가기를 누르면 시트를 닫지 않고 시작 홈으로 간다.

그래서 `_pages/ingredients`가 처음 그릴 때 주소에 이 시트 쿼리가 있으면 `replaceState`로 쿼리를 지운 뒤 `openSheet()`를 부른다. 기록은 `시작 홈 → /ingredients → /ingredients?sheet=ingredient-picker`가 되고, 뒤로가기는 시트를 닫고 한 번 더 누르면 시작 홈으로 간다. `useSheetRoute`는 고치지 않는다.

## 재료 목록

`widgets/ingredient-list`. 재료 한 줄은 펼침 버튼(`aria-expanded`, `aria-controls`)이고 그림, 이름, 정한 양을 보여 준다.

- 정한 양은 `formatQuantity(amount, unit)`로 쓴다. 0.5는 "½", 0.25는 "¼", 0.75는 "¾"로, 그 밖은 소수 둘째 자리까지 끝의 0을 지운 숫자로 쓴다. 천 단위 쉼표를 넣는다. 예: "½개", "300g", "1,500g", "1.25봉지".
- 양을 정하지 않은 재료는 "양 고르기"를 Ink 글자로 쓴다. 판단에 필요한 정보라서 Muted로 약하게 만들지 않는다.
- 목록의 g 표시는 사용자가 넣은 수량이라 `formatAmount`를 쓰지 않는다. `formatAmount`는 g을 단위로 되돌리는 표시용이라 0.33개를 넣으면 "약 0.3개"가 되기 때문이다.

## 수량 편집

`AmountEditor`는 재료 하나를 받아 다음을 보여 준다.

1. 제목 "얼마나 가지고 있나요?". 재료 이름은 바로 위 재료 줄에 있으므로 화면에는 쓰지 않는다
2. 빠른 수량 버튼 세 개와 "직접 입력" 버튼(`aria-expanded`)
3. 펼친 직접 입력
4. "재료 삭제" Ghost 버튼

수량을 고르는 영역에는 그림을 두지 않는다.

### 빠른 수량 버튼

`model/quick-amounts.ts`의 `quickAmounts(ingredient)`가 `inputUnits[0]` 단위로 값을 계산한다.

| 조건 | 값 |
| --- | --- |
| 단위가 g | 100, 200, 300 |
| `unitGrams[단위] < 100` | 2, 5, 10 |
| 그 밖 | 0.5, 1, 2 |

지금 데이터에서 2, 5, 10을 받는 재료는 홍고추, 청고추, 계란, 표고버섯, 깻잎, 상추, 새우, 밤, 대추, 양송이버섯, 김, 케일, 셀러리다.

버튼 글자는 `formatQuantity`로 쓴다(예: "½개", "5개", "100g"). 지금 양과 단위가 같은 버튼은 `aria-pressed="true"`와 체크를 보여 준다. 누르면 `setAmount(id, 값, inputUnits[0])`을 부르고 다음 미완료 재료를 펼친다.

### 직접 입력

직접 입력을 펼치면 수량 칸(`Input inputMode="decimal"`), 단위 선택(`ToggleGroup type="single"`, `inputUnits` 순서), "이 양으로 정하기" 주 버튼을 보여 준다. 수량 칸에는 보이는 label "직접 입력"을 단다.

- 처음 값: 양을 정했으면 그 수량과 단위, 아니면 빈 칸과 `inputUnits[0]`.
- 단위가 g 하나뿐이면 g 토글 하나를 고른 상태로 보여 준다.
- 저장하면 검사를 통과한 값으로 `setAmount`를 부르고 다음 미완료 재료를 펼친다.

#### 검사

`model/amount-input.ts`의 `parseAmount(text, ingredient, unit)`가 맡는다. 앞뒤 공백을 지우고 `Number()`로 바꾼다. 다음이면 오류다.

- 숫자가 아니거나 0 이하
- 100,000 초과
- `toGrams(ingredient, 값, unit)`이 10,000,000 초과

오류는 저장을 누를 때 보여 준다. 수량 칸에 `aria-invalid`와 `aria-describedby`(오류 문구의 id)를 달고, Error 경계와 그 아래 오류 문구 "0보다 크고 100,000 이하인 숫자로 넣어 주세요."를 둔다. 오류 문구는 `role="alert"`다. 수량을 고치면 오류를 지운다.

#### 단위 환산

직접 입력 상태는 `{ text: string; unit: InputUnit; grams: number | null }`이다. `grams`는 마지막으로 사용자가 넣은 수량을 g으로 바꾼 값이다.

- 수량 칸에 입력하면 `text`를 바꾸고, 숫자로 읽히면 `grams`를 다시 구한다. 읽히지 않으면 `grams`는 `null`이다.
- 단위를 바꾸면 `grams`가 있을 때 `grams / gramsPerUnit(새 단위)`를 소수 둘째 자리까지 반올림해 `text`에 넣는다. `grams`는 바꾸지 않는다. 그래서 개 → g → 개로 오가도 처음 수량으로 돌아온다.
- 저장할 때 `text`가 환산으로 넣은 값 그대로면 반올림 전 값(`grams / gramsPerUnit`)을 저장한다. 사용자가 고쳤으면 `text`를 저장한다.

예: 양파 1개 → g 200 → 개 1. 무 100g → 개 0.07(저장하면 0.0666…개, 즉 100g) → g 100.

### 가상 키보드

직접 입력 칸에 포커스가 있는 동안 아래 고정 주 행동을 숨긴다. Android Chrome은 키보드가 열리면 화면 높이가 줄어 고정 영역이 입력칸과 저장 버튼을 가릴 수 있기 때문이다. 포커스를 받으면 입력칸과 저장 버튼이 보이도록 `scrollIntoView({ block: 'nearest' })`를 부른다.

데스크톱 기기 흉내로 확인하고, 실제 휴대폰 확인은 사용자에게 부탁한다.

## 기본 양념

`_pages/ingredients/ui/pantry-basics.tsx`. "기본 양념은 직접 입력하지 않아도 돼요." 옆에 `Collapsible` 트리거 Ghost 버튼을 둔다. 접혀 있으면 "{개수}개 보기", 펼치면 "목록 접기"다. Radix가 `aria-expanded`와 `aria-controls`를 단다. 목록은 `pantryBasics`를 쉼표로 이은 읽기 전용 글이다. 개수와 이름은 데이터에서 가져온다(지금 12개).

## 인분

`ServingsPicker`. "한 번에 몇 인분씩 만들까요?"를 label로 둔 `ToggleGroup type="single"`이고 항목은 1~4인분이다. 고른 항목은 Ink 면, Light 글자, 체크다. 이미 고른 항목을 다시 눌러도 선택을 풀지 않는다. Radix가 빈 값을 넘기면 무시한다.

항목 글자 "{인분}인분"은 copy.md에 없으므로 `copy.ingredients.servingsOption`으로 더한다.

## 주 행동

화면 아래 고정 영역(앱 열 폭, Light 면, 위쪽 Ink 선)에 48px 주 버튼을 둔다. 본문 아래에는 고정 영역 높이만큼 여백을 둬 마지막 구역이 가려지지 않게 한다.

| 상태 | 버튼 | 누르면 |
| --- | --- | --- |
| 담은 재료 없음 | "요리 찾기", 비활성. 버튼 위에 "재료를 담으면 요리를 찾을 수 있어요." | 없음 |
| 양을 정하지 않은 재료 있음 | "남은 {개수}개 양 정하기" | 첫 미완료 재료를 펼친다 |
| 모두 정함 | "요리 찾기" | `router.push('/results')` |

## 결과 화면에 넘기는 입력

추천 결과(세션 D)는 `build-inventory`의 공개 API로 입력을 읽는다. 결과 화면은 다음을 지킨다고 보고 이 화면을 만든다.

```ts
// features/build-inventory
type InventoryItem = {
  ingredientId: string; // Ingredient.id. pantry가 null인 재료만 들어 있다
  amount: number | null; // 사용자가 고른 단위의 수량. 요리 찾기로 넘어올 때는 모두 0 초과 숫자다
  unit: InputUnit;      // 사용자가 고른 단위. 결과 화면의 양 표시에 쓴다
};
type InventoryState = { items: InventoryItem[]; servings: number }; // servings는 1~4, 처음 값 2

useInventory: zustand 스토어 훅. 예: useInventory((s) => s.items)

/** 재료가 하나 이상이고 모두 양을 정했는지 */
function isInventoryReady(state: Pick<InventoryState, 'items'>): boolean;

/** 추천 함수와 /api/candidates에 넣는 Stock[]. 담은 순서를 유지한다 */
function toStocks(items: InventoryItem[], ingredients: Ingredient[]): Stock[];
```

- `items`의 순서는 담은 순서다.
- `toStocks`는 `toGrams(ingredient, amount, unit)`으로 g을 구한다. `amount`가 `null`이거나 `ingredients`에 없는 id는 빼고, 환산 근거가 없어 0g인 재료도 뺀다. 지금 데이터와 이 화면의 단위 선택으로는 빠지는 재료가 생기지 않는다.
- 한 재료의 g은 10,000,000 이하다. 직접 입력 검사가 막는다.
- 결과 화면은 `isInventoryReady`가 `false`면 시작 홈으로 보낸다(`docs/architecture.md` "라우트"). 새로고침하면 저장소가 처음 상태라 이 경우에 해당한다.
- 결과 화면에서 재료 수정으로 돌아올 때는 저장소를 바꾸지 않는다. 이 화면은 저장소의 재료, 수량, 단위, 인분을 그대로 보여 주고 모든 편집을 접는다.
- 결과 화면이 양을 표시하는 데 필요한 `Ingredient[]`는 결과 화면이 서버에서 직접 읽는다. 이 화면은 넘기지 않는다.

## 문구

`src/shared/copy/index.ts`의 `ingredientSheet`, `ingredients`를 쓴다. 다음을 더하고 `docs/copy.md`에도 같은 줄을 더한다. 수량 제목(`ingredients.amountTitle`)은 재료 이름 없는 고정 문구 "얼마나 가지고 있나요?"로 바꾼다.

| 키 | 문구 |
| --- | --- |
| `ingredientSheet.addDisabledReason` | 재료를 고르면 담을 수 있어요. |
| `ingredients.findMealsDisabledReason` | 재료를 담으면 요리를 찾을 수 있어요. |
| `ingredients.servingsOption(n)` | {인분}인분 |
| `ingredients.unit` | 단위. 직접 입력의 단위 고르기 이름이다 |

## 문서 반영

| 문서 | 고칠 곳 |
| --- | --- |
| `docs/copy.md` | 위 "문구"의 네 줄과 수량 제목 |
| `docs/requirements/ingredient-input.md` | 직접 입력의 허용 범위에 "g으로 바꾼 값이 10,000,000g을 넘으면 같은 오류를 보여 준다"를 더한다 |
| `docs/specs/app-foundation.md` | "인분 기본값은 이번 스펙에서 정하지 않는다" 문장을 "인분 기본값은 2다"로 고친다 |
| `docs/architecture.md` | `build-inventory`가 `index.server.ts`로 서버 전용 재료 목록 함수를 내보낸다고 적는다 |

## 테스트

- `quickAmounts`: g, 100g 미만, 그 밖의 단위 세 경우. 실제 데이터가 있으면 모든 `pickable` 재료가 버튼 세 개를 받는지 본다.
- `parseAmount`: 빈 칸, 문자, 0, 음수, 100,000, 100,000.1, 10,000,000g 초과(배추 4,001포기).
- 단위 환산: 개 → g → 개, g → 개 → g이 처음 수량으로 돌아오고, 사용자가 고친 값은 고친 대로 저장한다.
- `matchesQuery`: id, 별칭, 공백 차이, 공백뿐인 검색어.
- `formatQuantity`: ½, ¼, ¾, 정수, 소수, 천 단위.
- `toStocks`, `isInventoryReady`: g 환산, 순서 유지, 미정·없는 id 제외.
- `getPickableIngredients`: 실제 데이터가 있으면 양념이 빠지고 횟수 순서인지 본다.
- `IngredientPickerSheet`(jsdom): 여러 개 고르고 닫으면 저장소가 그대로, 검색으로 가린 재료의 선택 유지, 담긴 재료는 고를 수 없음, 담으면 고른 순서로 들어감.
- 수량 편집(jsdom): 빠른 수량을 누르면 다음 미완료 재료가 펼쳐짐, 범위를 벗어난 값에서 `aria-invalid`와 `aria-describedby`가 오류 문구를 가리킴.

## 화면 확인

`npm run build && npm run start`로 띄우고 브라우저로 다음을 확인한다. `/ingredients`는 첫 방문 리다이렉트 대상이 아니라 쿠키 없이 들어갈 수 있다.

- 요구사항 문서의 확인 기준. 결과 화면이 아직 없으므로 "결과에서 돌아오기"는 `/results`로 간 뒤 뒤로가기로 돌아와 저장소 값이 그대로인지 본다.
- 360px, 390px 폭에서 긴 재료 이름("노랑 파프리카", "다진 쇠고기"), 수량, 단위가 넘치거나 잘리지 않는지
- `/ingredients?sheet=ingredient-picker`로 들어와 뒤로가기를 두 번 누르면 시트가 닫힌 뒤 이전 화면으로 가는지
- 키보드만으로 재료를 고르고 담고 양을 정해 요리 찾기까지 갈 수 있는지
- 동작 줄이기에서 시트와 펼침이 0ms인지

## 하지 않는 것

- 계산 중 화면과 `/results`. 추천 결과 작업이 만든다.
- 목록에 없는 재료를 직접 적어 넣는 기능, 사진·영수증 입력.

## 완료 기준

- `docs/requirements/ingredient-input.md`의 확인 기준을 지킨다. 실제 휴대폰 키보드 확인은 사용자 확인으로 남긴다.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`가 통과한다.
- `fsd-review`에서 층 위반이 없다.
