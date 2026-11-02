# 재료 선택 시트 양념 검색 안내

재료 선택 시트에서 양념을 검색하면 "목록에 없어요" 대신 양념 종류별 안내를 보여 준다. 시트는 `pantry`가 `null`인 재료만 보여 주므로 지금은 "간장", "마늘", "다진마늘"을 찾아도 목록에 없다고 답한다.

- 이슈: #34 재료 선택 시트 양념 검색 안내
- 기준 문서: `docs/requirements/ingredient-input.md`("양념 검색 안내"), `docs/copy.md`("재료 선택 시트"), `docs/data-contract.md`
- 브랜치: `feat/seasoning-search`

## 사용자와 정한 것

| 항목 | 결정 |
| --- | --- |
| 안내 | 종류별로 다르다. 기본은 "있다고 보고 계산해요", 특수는 "요리에 필요하면 ‘필요한 양념’으로 알려 드려요" |
| 이름 | 검색어가 아니라 양념의 `id`를 쓴다. "다진마늘"은 "마늘"로 쓴다 |
| 조사 | 은/는을 마지막 이름의 받침에 맞춘다 |
| 일반 재료와 함께 맞을 때 | 재료가 하나라도 맞으면 안내를 보여 주지 않고 재료만 보여 준다 |
| 안내 위치 | 검색칸 아래, 재료 격자 자리. 재료가 하나도 맞지 않을 때만 격자 대신 나온다 |

## 동작

1. 검색어가 공백뿐이면 지금처럼 모든 재료를 보여 주고 안내는 없다.
2. 일반 재료(`shown`)가 하나라도 있으면 격자만 보여 준다.
3. `shown`이 비었고 맞는 양념이 있으면 격자 자리에 양념 안내를 보여 준다. 검색어 지우기 버튼은 두지 않는다.
4. `shown`이 비었고 맞는 양념도 없으면 지금처럼 "목록에 없어요"와 검색어 지우기를 보여 준다.

양념 안내는 종류마다 한 문장이다. 맞는 양념이 한 종류뿐이면 안내도 한 줄이고, 두 종류가 섞이면 기본, 특수 순서로 두 줄이다. 한 종류에 여러 양념이 맞으면 `id`를 쉼표로 이어 한 문장에 쓴다. 이름은 데이터 순서를 따르고 중복은 없다. 안내 영역은 `role="status"`로 둔다.

### 양념 검색

`matchesQuery`는 `id`와 `aliases` 전체에서 찾는다. 양념은 별칭에 "[불고기양념] 간장", "[멸치장국] 국멸치"처럼 요리 이름을 대괄호로 붙인 원문 표기가 있다. 이 앞부분까지 찾으면 "불고기"를 검색할 때 간장이 맞으므로, 양념 검색은 대괄호로 묶인 앞부분을 뺀 별칭에서 찾는다. 공백을 모두 지운 뒤 포함 여부로 찾는 것은 `matchesQuery`와 같다. 일반 재료의 검색은 바꾸지 않는다.

## 구현

| 위치 | 변경 |
| --- | --- |
| `features/build-inventory/model/pickable.ts` | `PickableIngredients`에 `seasonings: Ingredient[]`를 더한다. `pantry`가 `"기본"`이나 `"특수"`인 재료이고 데이터 순서를 따른다 |
| `features/build-inventory/model/search.ts` | `findSeasonings(seasonings, query)`를 더한다. 맞는 양념을 `{ basic: string[]; special: string[] }`(`id` 목록)로 돌려준다 |
| `features/build-inventory/ui/ingredient-picker-sheet.tsx` | `seasonings: Ingredient[]` prop을 받는다. `shown`이 비었을 때 위 동작으로 갈라 그린다 |
| `_pages/ingredients` | `getPickableIngredients`의 `seasonings`를 `IngredientInputScreen`을 거쳐 시트에 넘긴다 |
| `shared/lib/korean.ts` | `topicParticle(word)`를 더한다. 마지막 글자에 받침이 있으면 "은", 없으면 "는"을 돌려준다. 한글 음절이 아닌 글자로 끝나면 "는"이다 |
| `shared/copy/index.ts` | `ingredientSheet.basicSeasoning(names)`와 `specialSeasoning(names)`를 더한다. `names: string[]`를 ", "로 잇고 `topicParticle`로 조사를 붙인다 |

서버에서 넘기는 양념은 59개이고 재료 목록과 함께 정적으로 만들어진다. 문구는 `docs/copy.md`에 먼저 넣었다.

## 시험

- `search.test.ts`(새 파일): `findSeasonings`
  - "간장"은 기본, "마늘"과 "다진마늘"은 `special: ['마늘']`
  - "불고기"처럼 대괄호 안 이름만 맞는 검색은 비어 있다
  - "불고기양념 간장"처럼 대괄호 부분을 포함한 검색어는 맞지 않는다
  - 별칭의 공백은 지우고 찾는다("다진마늘"로 "다진 마늘"을 찾는다)
  - 한 종류에 여럿이 맞으면 목록에 모두 담기고 중복이 없다
- `korean.test.ts`(새 파일): 간장은, 마늘은, 버터는, 소금은, 영문·숫자로 끝나는 말은 "는"
- `ingredient-input.test.tsx`: 시트에서
  - 기본 양념 검색은 기본 안내를 보여 주고 "목록에 없어요"가 없다
  - 특수 양념 검색은 특수 안내를 보여 주고 이름이 표준명이다
  - 재료와 양념이 함께 맞으면 안내가 없다
  - 양념도 재료도 맞지 않으면 기존 문구와 검색어 지우기가 있다
- `inventory-output.test.ts`: `orderPickable`의 `seasonings`가 `pantry`가 null이 아닌 재료만 담는다
- lint, 타입 검사, 전체 테스트, `fsd-review`, `npm run build`

## 확인 기준

`docs/requirements/ingredient-input.md`의 확인 기준을 따른다. 추가로 실제 데이터로 "간장", "다진마늘", "버터", "고추", "불고기"를 검색해 문구와 조사를 눈으로 본다.
