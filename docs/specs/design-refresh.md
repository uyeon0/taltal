# 디자인 보완

사용자와 정한 디자인 보완을 이미 만든 화면에 적용한다. 화면 배경을 주황으로 바꾸고, 카드와 선택 항목의 모양을 역할별로 나누고, 결과 요약과 요리 카드의 글자 위계를 바꾼다. 화면 구성, 동작, 문구는 바꾸지 않는다.

- 이슈: #22 디자인 보완
- 기준 문서: `docs/design.md`, `docs/tokens.css`, `docs/architecture.md`, `docs/copy.md`
- 참고 시안: `docs/wireframes/design-refresh-study.html`. "그림" 비교의 M-1, P-1이 이 스펙의 결과 모습이다.
- 브랜치: `feat/design-refresh`(`main`의 `55af5d7`에서 분기)

## 사용자와 정한 것

| 항목 | 결정 |
| --- | --- |
| 화면 배경 | 모든 화면을 주황 바탕으로 둔다. 정보와 입력은 Light 카드에 담는다 |
| 바텀시트 | Light 면을 유지한다 |
| 주요 버튼 색 | 버튼 바로 아래 면을 따른다. Light 카드 안이면 Primary 면, 주황 바탕 위면 Ink 면 |
| 라운딩 | 카드 20px, 하나 고르는 선택 항목은 알약 모양, 입력·버튼·여러 개 고르는 재료 칸은 8px |
| 같은 묶음의 행 | 담은 재료 목록과 요리 목록을 각각 카드 하나에 담고 행 사이를 1px Subtle 선으로 나눈다 |
| 결과 요약 카드 | 모서리를 24px씩 사선으로 깎은 Light 카드 |
| 보조 행동 | 직접 입력, 재료 추가를 Ghost로 바꾼다 |
| 라벨 태그 | 결과 요약의 "다 써요", "남아요"와 요리 카드의 "N번째 요리"를 Ink 알약 태그로 바꾼다 |
| 요약 수치 | 24px, 700. 라벨 태그와 한 줄에 두고 세로 가운데로 맞춘다 |
| 부가 정보 이름 | "있으면 좋음", "필요한 양념"을 굵게 쓴다 |
| 요리 카드의 재료 그림 | 담은 재료 목록과 같은 48px |
| 다람쥐 | 위치를 바꾸지 않는다 |

## 범위 밖

- 소개 캐러셀의 미리 보기 영역 채우기. 별도 작업으로 한다.
- 장식 움직임.
- 제목 자간 조정.

## 토큰과 전역 스타일

`docs/tokens.css`의 바뀐 값을 `src/_app/styles/globals.css`의 `:root`에 옮긴다. `tokens.test.ts`가 두 파일을 비교하므로, 옮기기 전에는 이 테스트가 실패한다.

| 토큰 | 값 |
| --- | --- |
| `--radius-card` | `1.25rem` (12px에서 20px) |
| `--radius-pill` | `9999px` (새 토큰) |
| `--summary-corner-cut` | `1.5rem` (새 토큰) |

`@theme`에 `--radius-pill`을 Tailwind 라운딩으로 연결해 `rounded-pill`로 쓴다. `rounded-xl`은 `--radius-card`를 가리키므로 값만 바꾸면 카드가 모두 20px이 된다.

### 앱 열

`.app-column`의 배경을 Light에서 주황으로 바꾸고, 루트 레이아웃의 앱 열 요소에 `surface-brand`를 붙인다. 그러면 모든 화면이 주황 바탕이 되고, shadcn 기본 버튼이 Ink 면으로 바뀐다. 바텀시트는 `body` 아래 포털로 그려지므로 앱 열 밖에 있어 Light로 남는다. 앱 열 바깥(448px보다 넓을 때)은 Light 그대로다.

이제 각 화면에 있는 `surface-brand`는 필요 없다. 시작 홈과 소개의 `surface-brand`를 지운다.

### 결과 요약 카드 모양

Tailwind 임의 값을 쓰면 `design-values.test.ts`에 걸리므로, 사선 모서리는 `globals.css`에 클래스 `.summary-card`로 만든다. `clip-path`는 테두리를 잘라 내므로 바깥 요소를 Ink 면으로 칠해 3px 안쪽에 Light 면을 겹친다.

```css
/* 결과 요약 카드. 네 모서리를 사선으로 깎는다. 바깥 Ink 면 안에 Light 면을 기본 선 굵기만큼 들여 겹쳐 선을 만든다 */
.summary-card {
  --cut: var(--summary-corner-cut);
  padding: var(--border-width);
  background-color: var(--neutral-ink);
  clip-path: polygon(/* 8개 꼭짓점, --cut */);
}
.summary-card > * {
  --cut-inner: calc(var(--cut) - /* 사선 방향 선 굵기 보정 */);
  background-color: var(--neutral-light);
  clip-path: polygon(/* --cut-inner */);
}
```

안쪽 꼭짓점 보정값은 사선 선 굵기가 3px로 보이게 구현하면서 정한다. 시안은 1.25px을 뺐다. 카드 안에 포커스를 받는 버튼이 있으므로, 포커스 외곽선이 `clip-path`에 잘리지 않는지 확인한다.

## 공통 컴포넌트

| 파일 | 바꾸는 것 |
| --- | --- |
| `shared/ui/card.tsx` | `surface-default`를 기본으로 붙인다. 주황 바탕 안에서도 카드 안의 주요 버튼이 Primary 면이 되고 부가 글자가 Muted로 돌아온다. 주석의 "12px 라운딩", "주황 카드는 쓰는 쪽에서 surface-brand를 더한다"를 지금 규칙으로 고친다 |
| `shared/ui/toggle.tsx` | `toggleVariants`의 `rounded-lg`를 `rounded-pill`로 바꾼다. 인분, 가짓수 탭, 수량 빠른 선택, 단위 선택이 모두 알약이 된다 |
| `shared/ui/label-tag.tsx` (새 파일) | 라벨 태그. `span`, Ink 면, Light 글자, 선 없음, `rounded-pill`, `px-3 py-1`, `text-xs font-bold`. 누를 수 없는 표시라 hover와 pressed 모습이 없다 |

## 화면별 변경

### 시작 홈 (`_pages/home`)

- 머리 영역을 감싼 `surface-brand`를 지운다. 머리 영역과 "직접 고르기" 구역이 같은 주황 바탕이 된다.
- "직접 고르기" 버튼은 주황 바탕 위에 있으므로 Ink 면이 된다. 코드는 바꾸지 않는다.
- 예시 묶음 카드는 `Card`라서 Light 카드, 20px 라운딩이 된다.

### 재료 입력 (`_pages/ingredients`, `widgets/ingredient-list`, `features/build-inventory`)

- `IngredientList`: 재료마다 있던 `li`의 3px 상자를 지우고, 목록 전체(`ul`)를 Light 카드 하나(3px Ink 선, `rounded-xl`, `overflow-hidden`)로 감싼다. 행 사이는 1px Subtle 선(`divide-y`)으로 나눈다. 행 버튼의 `rounded-xl`도 지운다. 빈 목록 안내와 다람쥐는 그대로다.
- `AmountEditor`: "직접 입력" 펼침 버튼을 `secondary`에서 `ghost`로 바꾼다. Ghost는 아이콘을 빼지 않으므로 지금의 펼침 아이콘을 유지한다.
- `IngredientInputScreen`: "재료 추가" 버튼을 `secondary`에서 `ghost`로 바꾼다. 아이콘(`Plus`)을 유지한다.
- 아래 고정 영역은 `bg-background`라서 주황이 되고, 주 버튼은 Ink 면이 된다. 코드는 바꾸지 않는다.
- 인분 선택은 `ToggleGroup` 변경으로 알약이 된다. 인분 선택을 카드에 담지 않는다. 주황 바탕 위의 Light 알약으로 둔다.

### 재료 선택 시트 (`features/build-inventory/ui/ingredient-picker-sheet.tsx`)

시트는 Light 그대로다. 재료 칸은 여러 개 고르는 항목이라 8px이어야 하므로 `rounded-xl`을 `rounded-lg`로 바꾼다.

### 추천 결과 (`_pages/results`, `widgets/result-summary`, `widgets/meal-list`)

`ResultSummary`

- `surface-brand`와 `rounded-xl border`를 지우고 `.summary-card`를 쓴다.
- 다 쓰는 재료와 남는 재료의 머리 줄을 라벨 태그와 수치로 나눈다. 한 `p` 안에 `LabelTag`와 수치(`text-2xl font-bold`)를 `flex items-center gap-2`로 둔다. 화면 읽기 프로그램은 지금처럼 "다 써요 1개"로 읽는다.
- 두 덩어리 사이를 1px Subtle 선으로 나눈다.
- "남는 재료 없음"은 라벨 태그 없이 지금처럼 `text-xl font-semibold`로 둔다.

`MealList`

- 요리마다 있던 `li`의 3px 상자를 지우고, 목록(`ol`)을 Light 카드 하나로 감싼다. 행 사이는 1px Subtle 선이다. 재료 입력의 목록과 같은 방식이다.
- 순서 줄: 배분색 표시 뒤에 "N번째 요리"를 `LabelTag`로 두고, 빨리 상하는 이유는 태그 뒤에 14px 글자로 이어 쓴다.
- 가진 재료 그림을 `size={32}`에서 `size={48}`로 바꾼다.
- "있으면 좋음", "필요한 양념"은 이름 부분만 `font-bold`로 감싼다. 콜론 뒤 목록은 지금 굵기 그대로다.

`ResultsView`

- "조금 사서 더 써 볼까요?" 구역을 `Card`로 바꾼다. 안의 주 버튼은 Light 카드 안이라 Primary 면이 된다.
- 다람쥐, 가짓수 탭, 안내 문구의 배치는 바꾸지 않는다. 안내 문구의 `text-muted-foreground`는 주황 바탕에서 Ink가 된다.

계산 중, 추천 없음, 오류 상태도 주황 바탕이 된다. `StatusMessage`는 Light 바탕이라 바꾸지 않는다.

### 소개 (`_pages/intro`)

`main`의 `surface-brand`를 지운다. 앱 열이 이미 주황이다. 미리 보기 영역은 `Card`라서 20px 라운딩이 된다.

### 사용량 시트, 레시피 상세 시트

시트는 Light 그대로다. 레시피 상세 안의 카드 모양 영역은 `rounded-xl`이라 20px이 된다. 사용량 막대는 `rounded-lg`라 바뀌지 않는다.

## 문구

`docs/copy.md`의 문구는 바꾸지 않는다. 화면에 보이는 글자와 읽는 순서가 같고, 요소만 나눈다. `shared/copy`에는 나눈 부분을 위한 항목을 더한다.

| 지금 | 더하는 항목 |
| --- | --- |
| `results.summaryUsedUp(n)` → "다 써요 n개" | `results.summaryUsedUpLabel`("다 써요"), `results.summaryCount(n)`("n개") |
| `results.summaryLeftover(n)` → "남아요 n개" | `results.summaryLeftoverLabel`("남아요") |
| `mealCard.optional(재료)` → "있으면 좋음: 재료" | `mealCard.optionalLabel`("있으면 좋음") |
| `mealCard.specialSeasoning(양념)` → "필요한 양념: 양념" | `mealCard.specialSeasoningLabel`("필요한 양념") |

나눈 뒤 쓰지 않게 되는 원래 함수는 지운다.

## 테스트

- `tokens.test.ts`, `design-values.test.ts`가 통과해야 한다.
- `meal-list.test.tsx`는 `getByText(copy.mealCard.optional('대파'))`로 한 덩어리 글자를 찾는다. 이름과 목록이 다른 요소로 나뉘므로, 카드의 글자 내용으로 찾도록 고친다.
- `ResultSummary`의 라벨 태그와 수치를 화면 읽기 프로그램이 "다 써요 1개"로 읽는지 테스트를 더한다.

## 확인 기준

- 소개, 시작 홈, 재료 입력, 추천 결과와 계산 중, 추천 없음, 오류가 모두 주황 바탕이고, 세 바텀시트는 Light다.
- 주황 바탕 위의 주요 버튼은 Ink 면이고, Light 카드 안의 주요 버튼은 Primary 면이다.
- 카드는 20px, 인분·가짓수·수량 빠른 선택·단위 선택은 알약, 입력·버튼·재료 선택 칸은 8px이다.
- 담은 재료 목록과 요리 목록이 각각 카드 하나이고 행 사이가 1px Subtle 선이다.
- 결과 요약 카드의 사선 모서리 선이 끊기지 않고, 카드 안 버튼의 포커스 외곽선이 잘리지 않는다.
- 360px, 390px 폭에서 가짓수 탭 세 개, 요약 태그와 수치, 요리 카드의 태그와 이유 문구가 넘치거나 잘리지 않는다.
- 주황 바탕의 글자가 모두 Ink다. Muted 글자가 주황 바탕에 남아 있지 않다.
- lint, 타입 검사, 테스트가 통과하고 `fsd-review`에 새 위반이 없다.

## 문서

- `docs/wireframes/README.md` 표에 `design-refresh-study.html`을 더한다. 참고할 내용은 "색 면, 모양, 글자, 그림을 비교한 디자인 보완 시안", 관련 문서는 `design.md`다.
