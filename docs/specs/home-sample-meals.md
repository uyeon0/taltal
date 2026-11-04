# 시작 홈 예시 요리 묶음

시작 홈의 "직접 고르기" 아래에 예시 요리 묶음 3개를 옆으로 넘기는 캐러셀로 보여 준다. 소개 캐러셀의 넘기기 코드를 `shared/ui`로 옮겨 소개와 시작 홈이 같이 쓴다.

- 이슈: #14 시작 홈 구성 변경
- Notion 태스크: PROJ1-128
- 기준 문서: `docs/requirements/onboarding.md`의 "시작 홈" 절, `docs/copy.md`의 "공통"과 "시작 홈" 절, `docs/design.md`, `docs/architecture.md`, `docs/requirements/results.md`의 "요리 카드" 절
- 브랜치: `feat/home-sample-meals`. 이슈에 적힌 `27141c1`(#12) 뒤로 #13, #15가 머지돼 있어서 `origin/main`의 `8390c37`에서 분기했다. `docs/copy.md`가 #13에서 바뀌어 충돌을 피하기 위해서다

## 사용자와 정한 것

| 항목 | 결정 |
| --- | --- |
| 형식 | 묶음 캐러셀. 묶음 하나가 장 하나다 |
| 내용 | 가진 재료 2가지를 모두 다 쓰는 묶음 3개: 오징어·오이, 돼지고기·계란, 닭고기·계란. 재료가 남는 예시는 서비스가 재료를 다 쓰게 해 주지 못한다는 인상을 준다 |
| 카드 위치 | 보이는 카드를 화면 가운데에 둔다 |
| 배치 | "직접 고르기" 아래. 버튼 위치가 지금과 같아서 360×560에서도 스크롤 없이 보인다 |
| 카드 길이 | 요리마다 번호와 이름 한 줄, 쓰는 양 한 줄로 줄인다. 따로 사는 재료는 묶음 전체에서 모아 카드 끝에 이름만 한 줄로 쓴다 |
| 구역 제목 | 이렇게 나눠 쓸 수 있어요 |
| 캐러셀 코드 | 소개 캐러셀을 `shared/ui`로 옮겨 같이 쓴다. 시작 홈에서는 점 표시와 화살표 버튼을 쓰지 않는다 |
| 예시 값 | 고정 값이다. 앱에서 추천을 실행하지 않는다 |

## 이 스펙에서 정한 것

사용자 확인이 필요한 항목이다.

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 예시 값을 만든 방법 | 레시피 3개 조합마다 두 요리 이상이 함께 쓰는 재료의 2인분 합을 가진 양으로 두고, 그 양이 정수 단위(1모, 3개, 500g 등)인 조합을 골랐다. 그 가진 양으로 `filterCandidates`와 `findMealOptions`를 돌려 3가지 묶음의 남는 양이 모두 1g 미만인 것만 남겼다. 세 묶음 모두 조금 사는 묶음이다. 양은 `formatAmount`로 쓴 값이다 | 화면의 요리 이름과 양이 실제 추천 결과와 같다. 값은 `docs/copy.md`의 "예시 묶음"에 있다 |
| 카드에 넣지 않는 것 | 인분, 순서 이유, 조리 시간, 필요한 특수 양념, 재료 그림, 있으면 좋은 재료, 사는 양 | 카드를 짧게 두기 위해서다. 있으면 좋은 재료는 없어도 만들 수 있어서 뺀다 |
| 글자 위계 | 재료 줄만 20px 700으로 키워 카드 제목으로 두고, 요리명은 16px 600(UI 항목명), 쓰는 양과 번호는 14px Ink, 따로 사요는 16px 400이다. 이 프로젝트의 `text-sm`은 16px이라 14px은 `text-xs`로 쓴다 | 모든 줄이 16px이고 네 줄이 600이라 제목이 구분되지 않았다. 요리명은 `docs/design.md`의 동적 요리명(20~24px)보다 작지만, 3가지를 한 카드에 나열하는 목록 항목이라 사용자가 정했다. 쓰는 양은 판단에 필요한 수량이라 Muted로 쓰지 않는다 |
| 요리 순서 표시 | 화면에는 번호만 둔다. 번호는 `aria-hidden`이고, 화면 읽기용으로 `copy.mealCard.order(n)`을 `sr-only`로 둔다 | 한 줄에 번호와 이름을 두기 위해서다. 날짜가 아니라 순서이므로 말투 규칙 5와 맞는다 |
| 카드 높이 | 남는 재료 줄을 빼기 전 345px 폭에서 404px였다. 너무 길면 요리 이름만 남기는 안으로 바꾼다 | 요구사항의 내용을 그대로 둔 스펙 첫 안은 약 500px로 추정했다 |
| 장 폭 | 앱 열 폭의 5/6(`basis-5/6`). 장 사이 16px은 공통 캐러셀이 둔다. 양옆에 이웃 장의 끝이 보인다 | 점 표시가 없으므로 넘길 수 있다는 것을 이웃 장으로 알린다. 디자인 값 검사가 Tailwind 임의 값을 막아서 85% 대신 분수를 쓴다 |
| 캐러셀 조작 문구 | 이전, 다음, 장 이동 점, 장 이름을 `copy.intro`에서 `copy.common`으로 옮긴다. 캐러셀 이름은 화면마다 둔다 | `shared/ui`의 캐러셀이 쓰는 문구라서다. `docs/copy.md`는 이미 고쳤다 |

## 파일

| 파일 | 내용 |
| --- | --- |
| `src/shared/ui/carousel.tsx` | 새 파일. 클라이언트 컴포넌트. `intro-carousel.tsx`의 Embla 연결, 장 접근성 속성, 점 표시, 화살표를 옮긴다 |
| `src/shared/ui/carousel.test.tsx` | 새 파일. `intro-carousel.test.tsx`의 넘기기 테스트를 옮기고, 조작 없는 모드의 테스트를 더한다 |
| `src/_pages/intro/ui/intro-carousel.tsx` | 장 내용(단계 문구, 화면 모형 영역, 다람쥐)만 남기고 `Carousel`에 넘긴다 |
| `src/_pages/intro/ui/intro-carousel.test.tsx` | 장 내용 테스트만 남긴다 |
| `src/_pages/home/ui/home-page.tsx` | "직접 고르기" 아래에 `SampleMeals`를 둔다 |
| `src/_pages/home/ui/sample-meals.tsx` | 새 파일. 서버 컴포넌트. 구역 제목, 묶음 카드 3개를 `Carousel`에 넘긴다 |
| `src/_pages/home/model/samples.ts` | 새 파일. 예시 묶음 데이터 `SAMPLES`와 타입 |
| `src/_pages/home/ui/home-page.test.tsx` | 예시 구역 테스트를 더한다 |
| `src/shared/copy/index.ts` | `copy.common`에 캐러셀 문구를, `copy.home`에 예시 구역 문구를 더한다 |

`src/_pages/intro/ui/intro-carousel.tsx`와 그 테스트, `src/shared/`의 파일은 시작 홈 밖이지만 사용자가 캐러셀을 옮기기로 정해서 고친다.

## 공통 캐러셀

`src/shared/ui/carousel.tsx`의 `Carousel`이다. 도메인 이름을 넣지 않는다.

```tsx
type CarouselProps = {
  label: string; // 영역의 aria-label
  slides: { key: string; content: React.ReactNode }[];
  controls?: boolean; // 기본 true
  arrowAnchor?: string; // 화살표를 세로 중앙에 맞출 요소의 선택자. 장마다 하나
  align?: 'start' | 'center'; // 기본 start
  className?: string; // role="region" 영역
  slideClassName?: string;
};
```

두 모드의 차이는 다음과 같다.

| 항목 | `controls` true(소개) | `controls` false(시작 홈) |
| --- | --- | --- |
| 점 표시 | 영역 아래 | 없음 |
| 화살표 | 마우스 환경에서만, 끝에서 숨김 | 없음 |
| 보이지 않는 장 | `aria-hidden`, `inert` | 모두 읽힌다 |
| 키보드 | 점 표시로 옮긴다 | 장에 `tabIndex={0}`을 주고, 장에 포커스가 오면 그 장으로 넘긴다 |
| 장 여백과 포커스 외곽선 | 쓰는 쪽이 `slideClassName`으로 정한다 | 캐러셀이 장에 `group flex px-2 py-2`를 주고, 내용을 감싼 요소(12px 라운딩)에 `group-focus-visible`로 외곽선을 그린다. 장 자체의 외곽선은 Embla viewport의 `overflow: hidden`에 잘려서 끈다. 위아래 8px이 외곽선 자리이고, 장 사이는 16px이다. 내용은 장 폭과 높이에 맞춰 늘어난다 |

- 두 모드 모두 `role="region"`, `aria-roledescription="carousel"`, 장마다 `role="group"`, `aria-roledescription="slide"`, `aria-label`(`copy.common.slideLabel`)을 둔다.
- 동작 줄이기에서는 `scrollTo`, `scrollPrev`, `scrollNext`에 움직임 없음(`jump`)을 넘긴다. 포커스로 넘길 때도 같다.
- Embla 설정은 `{ loop: false, align }`이다. `align`이 `start`면 지금 소개와 같이 `containScroll: 'trimSnaps'`를 쓰고, `center`면 첫 장과 마지막 장도 가운데에 오도록 `containScroll: false`를 쓴다.
- `arrowAnchor`가 있으면 지금 소개처럼 보이는 장의 그 요소 세로 중앙에 화살표를 맞춘다. 없으면 영역 세로 중앙이다.

소개는 지금과 같은 모습과 동작을 유지한다. `IntroCarousel`이 `label={copy.intro.carouselLabel}`, `className="aspect-3/2 w-full"`, 지금의 장 클래스, `arrowAnchor='[data-slot="intro-preview"]'`를 넘긴다.

## 시작 홈

```text
┌ 주황 면 ─────────────────┐
│ 헤더                    │
│ 냉장고에          다람쥐  │  지금과 같다
│ 뭐가 있나요?              │
│ 가진 재료부터 담아 주세요. │
└───────────────────────────┘
[ 직접 고르기            → ]   360×560에서 298px. 바뀌지 않는다
이렇게 나눠 쓸 수 있어요
  ┌──────────────────────┐┌─
  │ 오징어 2마리 · 오이 2개 ││
  │ 가진 재료를 다 써요    ││
  │ ───────────────────── ││
  │ ① 오징어숙회           ││
  │   오징어 1마리         ││
  │ ② 오징어도라지생채     ││
  │   오징어 1마리 · 오이 1개
  │ ③ 오이나물             ││
  │   오이 1개             ││
  │ ───────────────────── ││
  │ 따로 사요: 대파, 도라지
  └──────────────────────┘└─
```

- 예시 구역은 "직접 고르기"가 있는 `section` 밖, 바로 아래에 둔다. 캐러셀이 화면 좌우 끝까지 써야 해서 좌우 간격이 있는 `section`에 넣지 않는다. "직접 고르기" 구역의 위아래 간격은 32px(`py-8`)이고, 아래 간격이 예시 구역과의 간격이다. 헤더와 주황 면은 바꾸지 않는다.
- 구역 제목 `h2`는 `copy.home.sampleTitle`, `font-display text-2xl`(고정된 짧은 제목)이다. 글자는 모두 낭만있구미체 지원 글자 목록에 있다. 화면에 "예시" 표시는 두지 않는다. 화면 읽기 프로그램은 캐러셀 이름(`copy.home.sampleCarouselLabel`, "예시 요리 묶음")으로 예시라는 것을 안다.
- 캐러셀은 `Carousel`에 `controls={false}`, `align="center"`, `label={copy.home.sampleCarouselLabel}`을 넘긴다. 영역은 화면 좌우 끝까지 쓴다. `slideClassName`은 `basis-5/6`만 넘긴다. 장 사이 여백과 포커스 외곽선은 공통 캐러셀이 맡는다. 장 높이는 가장 긴 장에 맞춘다.
- 카드는 `Card`(Light 면, Ink 선, 12px 라운딩), 안쪽 `--card-padding`이다. 카드를 누를 수 있는 것처럼 보이게 하지 않는다. hover, pressed 모습과 링크를 두지 않는다.

카드 안은 위에서 아래로 다음 순서다. 가진 재료를 다 쓴다는 문장을 요리 목록보다 위에 둔다.

| 순서 | 내용 | 모습 |
| --- | --- | --- |
| 1 | 재료(`ingredients`). 카드 제목 역할이다 | 20px(`text-xl`), 700, SUIT(`font-heading`) |
| 2 | `copy.results.titleAllUsed`(가진 재료를 다 써요). 예시 묶음은 모두 다 쓰므로 세 카드에 같은 문장이다 | 16px, 600 |
| 3 | Subtle 1px 구분선 | |
| 4 | 요리 3가지 `ol` | 아래 표 |
| 5 | Subtle 1px 구분선과 `copy.home.toBuy(toBuy)` | 16px, 400 |

| 요리 줄 | 문구 | 모습 |
| --- | --- | --- |
| 첫 줄 | 번호(24px 원, Ink 1px 선, 14px 숫자(`text-xs`), `aria-hidden`), `sr-only`의 `copy.mealCard.order(n)`, 이름 `name` | 이름은 16px, 600, SUIT |
| 둘째 줄 | `uses`. 번호 폭만큼 들여 쓴다 | 14px(`text-xs`), Ink |

카드 위쪽 줄 사이는 4px, 요리 사이는 `--list-gap`(8px), 구역 사이는 `--group-gap`(12px)이다. 순서 번호에 배분색은 쓰지 않는다. 사용량 막대가 없어서 색을 붙일 대상이 없다.

## 예시 데이터

예시 묶음은 `src/_pages/home/model/samples.ts`의 `SAMPLES`에 둔다. 시작 홈에서만 쓰는 고정 데이터라 `shared/copy`에 두지 않는다. 화면 문구의 기준은 `docs/copy.md`의 "예시 묶음"이다. 구역 제목처럼 문장인 문구는 `copy.home`에 둔다.

```ts
type SampleMeal = {
  name: string;
  uses: string; // "오징어 1마리 · 오이 1개"
};

type Sample = {
  ingredients: string; // "오징어 2마리 · 오이 2개"
  meals: SampleMeal[]; // 요리 순서대로
  toBuy: string; // "대파, 도라지"
};
```

`copy.home`에 더하는 문구는 다음과 같다.

| 키 | 값 |
| --- | --- |
| `sampleTitle` | 이렇게 나눠 쓸 수 있어요 |
| `sampleCarouselLabel` | 예시 요리 묶음 |
| `toBuy(ingredients)` | 따로 사요: {재료} |

`copy.common`에는 `prev`, `next`, `goToSlide(n)`, `slideLabel(current, total)`을 옮긴다. `copy.intro`에서는 이 넷을 지운다.

시작 홈은 서버 컴포넌트로 남는다. `SampleMeals`도 서버 컴포넌트이고, 장 내용을 `ReactNode`로 클라이언트 컴포넌트 `Carousel`에 넘긴다. 시작 홈은 입력 상태와 추천 함수를 import하지 않는다.

## 테스트

| 파일 | 확인하는 것 |
| --- | --- |
| `shared/ui/carousel.test.tsx` | 지금 `intro-carousel.test.tsx`의 점 표시, 화살표, `aria-hidden`, 동작 줄이기 테스트. `controls={false}`에서 점 표시와 화살표가 없고, 모든 장에 `aria-hidden`과 `inert`가 없고, 장에 포커스가 오면 그 장으로 `scrollTo`를 부르고, 동작 줄이기에서는 움직임 없이 부른다. 조작 없는 모드에서만 장이 `group`이고 내용을 감싼 요소에 외곽선 클래스가 있다 |
| `_pages/intro/ui/intro-carousel.test.tsx` | 장 세 개, 단계 문구, 화면 모형 영역, 다람쥐 대체 텍스트 |
| `_pages/home/ui/home-page.test.tsx` | 지금 테스트에 더해, 구역 제목이 있고, 장 세 개에 각 묶음의 재료, "가진 재료를 다 써요", 쓰는 양, "따로 사요" 문구가 있고, 요리 순서를 화면 읽기용 "N번째 요리"로 읽고, 예시 구역 안에 링크와 버튼이 없고, "직접 고르기" 링크가 예시 구역보다 문서 순서에서 앞에 있다 |

## 확인 방법

`npm run dev`로 띄우고 브라우저에서 확인한다.

- 360×560에서 "직접 고르기"가 스크롤 없이 보이고, 예시를 넣기 전과 위치가 같다.
- 360px, 390px, 1280px에서 카드의 재료, 요리명, 양이 잘리거나 가로로 넘치지 않는다. 보이는 카드가 가운데에 있고 양옆에 이웃 장의 끝이 보인다.
- 휴대폰 크기에서 스와이프로, 데스크톱에서 드래그로 넘긴다.
- Tab으로 장에 포커스를 옮기면 그 장이 보이고 포커스 외곽선이 보인다.
- 동작 줄이기를 켜면 포커스로 넘길 때 움직이지 않는다.
- 소개의 캐러셀이 바뀌기 전과 같게 동작한다. 점 표시, 화살표, 스와이프, 360×640에서 시작 버튼과 점 표시가 같이 보이는지 본다.

그 뒤 `npm run lint`, `npm run typecheck`, `npm test`, `fsd-review` 스킬로 점검한다. `shared/ui/carousel.tsx`에 도메인 이름이 없는지 `fsd-review`로 같이 본다.

## 문서 반영

- `docs/requirements/onboarding.md`: 시작 홈 구성 표에 예시 캐러셀을 더하고 "예시 요리 묶음" 절과 확인 기준을 더했다.
- `docs/copy.md`: 캐러셀 조작 문구를 "공통"으로 옮기고, "시작 홈"에 예시 문구와 "예시 묶음"을 더했다.
- `docs/architecture.md`: 바꾸지 않는다. `shared/ui`는 이미 "shadcn 컴포넌트와 공통 UI"를 담는다.
