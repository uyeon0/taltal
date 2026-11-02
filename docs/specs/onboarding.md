# 소개와 시작 홈

첫 방문 소개(`/intro`)와 시작 홈(`/`)을 만든다. 공통 기반이 둔 임시 확인 화면은 시작 홈으로 바꾸면서 지운다. 재료 입력 화면은 만들지 않는다.

- 이슈: #5 소개와 시작 홈
- 기준 문서: `docs/requirements/onboarding.md`, `docs/specs/app-foundation.md`, `docs/design.md`, `docs/copy.md`, `docs/architecture.md`
- 배치 참고: `docs/wireframes/home-first-visit.html`, `docs/wireframes/home-returning.html`. 문구, 수치, 색은 참고하지 않는다
- 브랜치: `feat/onboarding`(`feat/app-foundation`에서 분기한 뒤 PR #11이 머지된 `main`의 `f0038bf`를 받았다)

## 사용자와 정한 것

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| "직접 고르기"가 여는 시트 이름 | `/ingredients?sheet=ingredient-picker` | 재료 입력 스펙(`docs/specs/ingredient-input.md`)이 `INGREDIENT_PICKER_SHEET = "ingredient-picker"`로 정한 이름이다. 그 상수는 `features/build-inventory` 안에 있어 시작 홈은 같은 이름을 주소 문자열로 쓴다. 이름이 바뀌면 `_pages/home`의 상수 한 곳만 바꾼다 |
| 소개의 3단계 설명 | 옆으로 넘기는 캐러셀의 장 3개로 보여 준다 | 단계마다 그 단계의 결과 화면을 줄여 보여 주는 온보딩 장이다 |
| 장 안의 화면 모형 | 지금은 모형이 들어갈 빈 영역만 두고, 모형은 각 기능을 만들 때 채운다 | 각 화면의 디자인이 아직 정해지지 않았다 |
| 소개 제목과 설명 | 캐러셀 위에 고정한다 | 장을 넘겨도 서비스가 무엇인지 보인다 |
| 결과 예시 카드(두부 300g) | 지금은 소개에서 뺀다. 3장의 화면 모형을 만들 때 그 자리에 넣는다 | 3장이 "어디에 얼마나 쓰고 남는지"를 보여 주는 장이다 |
| 넘기기 도구 | `embla-carousel-react` | 사용자가 골랐다. CSS 스크롤 스냅은 쓰지 않는다 |
| 시작 버튼 위치 | 하단 고정 | 어느 장에서든 바로 시작할 수 있다 |
| 화살표 버튼 | 마우스 환경(`pointer: fine`)에서만 캐러셀 좌우 끝에 둔다 | 새 breakpoint를 만들지 않는다. 휴대폰은 스와이프와 점 표시를 쓴다 |
| 다람쥐 | 장마다 다른 포즈를 쓴다. 주인공이 아니라 영역의 오른쪽 아래 모서리에 걸친 작은 장식이다. 몸과 꼬리는 잘리지 않는다 | 사용자가 정했다. `docs/design.md`의 다람쥐 규칙에 소개 예외를 더한다 |
| 캐러셀 크기 | 캐러셀 영역은 가로 3, 세로 2 비율이다. 가로는 앱 열(최대 448px)이고 세로는 그 3분의 2다 | 아래 Light 영역이 없어져 캐러셀이 화면의 중심이 된다 |
| 머리글 | 주황 면 안에 넣는다 | 화면 맨 위부터 주황색이다 |
| 시작 홈의 기본 양념 목록 | 두지 않는다 | 와이어프레임에는 있지만 요구사항이 "기본 양념 목록은 재료 입력에만 둔다"고 정했다 |

## 파일

| 파일 | 내용 |
| --- | --- |
| `app/intro/page.tsx` | `_pages/intro`의 `IntroPage`를 내보내기만 한다 |
| `src/_pages/intro/index.ts` | 공개 API |
| `src/_pages/intro/ui/intro-page.tsx` | 서버 컴포넌트. 소개 전체 배치 |
| `src/_pages/intro/ui/intro-carousel.tsx` | 클라이언트 컴포넌트. Embla 캐러셀, 화살표, 점 표시 |
| `src/_pages/intro/ui/start-button.tsx` | 클라이언트 컴포넌트. 시작 버튼 |
| `src/_pages/home/ui/home-page.tsx` | 시작 홈으로 다시 쓴다. 서버 컴포넌트다 |
| `src/_pages/home/ui/foundation-preview.tsx` | 지운다 |

머리글(`AppHeader`)이 `useRouter`를 쓰는 클라이언트 컴포넌트라서 시작 홈은 머리글만 클라이언트이고 나머지는 서버에서 그린다. 문구는 `copy.intro`, `copy.home`에서 가져온다. 소개의 새 문구는 `docs/copy.md`에 먼저 더한다("소개" 절).

## 소개

첫 방문에만 나오는 화면이다. 머리글을 포함한 화면 전체가 주황 면(`surface-brand`)이다. 위에서 아래로 머리글, 제목과 설명, 캐러셀, 점 표시, 시작 버튼이다.

```text
┌ 머리글 ─────────────┐
│ 제목                │  고정
│ 설명                │
│ ┌─────────────────┐ │
│ ◀   3:2 캐러셀   ▶ │  ◀ ▶는 마우스 환경에서만
│ └─────────────────┘ │
│       ○ ● ○         │  점 표시
│ [ 내 재료로 시작하기 ] │  하단 고정
└─────────────────────┘
```

- 제목 `h1`은 `copy.intro.title`, `font-display text-display-sm`(28px)다. 360×640에서 시작 버튼과 점 표시가 같이 보이도록 기본 32px 대신 28px를 쓴다. 제목 영역은 위 8px, 아래 16px 간격을 둔다. 다람쥐 머리 오른쪽 위에 `Mascot pose="question"`(48px, `alt` 비움)을 겹쳐 둔다. 다람쥐를 감싼 `relative` 틀에 `absolute top-0 -right-4`로 놓아서 제목 폭을 줄이지 않는다. 제목 오른쪽에 `Mascot pose="default"`(80px, `alt` 비움, `priority`)를 나란히 둔다. 제목은 `flex-1 min-w-0`이고 설명은 그 아래 전체 폭이다. 설명은 `copy.intro.description`이고 20px(`text-xl`)다. 장을 넘겨도 움직이지 않는다
- 시작 버튼은 화면 아래에 붙인다(`sticky bottom-0`). 시작 버튼과 점 표시는 캐러셀 밖이라 장을 넘겨도 움직이지 않는다
- 세로는 `min-h-svh`인 flex 열이다. 내용이 화면보다 높으면 페이지가 스크롤되고, 시작 버튼은 항상 보인다

### 장 구성

장은 세 개다. 각 장은 `copy.intro.steps`의 문구 하나와 그 단계의 결과 화면을 줄여 보여 줄 빈 영역, 다람쥐 하나로 이뤄진다.

| 장 | 위 라벨 | 큰 문구 | 화면 모형이 들어갈 영역 | 다람쥐 |
| --- | --- | --- | --- | --- |
| 1 | `1단계` | `copy.intro.steps[0]` | 재료 입력 화면(`ingredient-input`) | `discovery` |
| 2 | `2단계` | `copy.intro.steps[1]` | 추천 결과 화면(`results`) | `thinking` |
| 3 | `3단계` | `copy.intro.steps[2]` | 사용량과 남는 양(`results`의 사용량 시트) | `meal` |

- 큰 문구는 낭만있구미체(`font-display text-2xl`, 24px), 장 안 가운데 정렬이다. 위 라벨은 부가 글자(14px 이상, 600)다. 문구는 장마다 `h2`다. 낭만있구미체 글자 목록에서 문구와 "단계"를 확인했다
- 화면 모형이 들어갈 영역은 지금은 빈 `Card`(`surface-default`)다. 화면 읽기에는 장식이라 `aria-hidden`을 준다. 영역의 크기와 위치는 장 안에서 문구 아래에 둔다. 영역은 `data-slot="intro-preview"`로 찾을 수 있게 한다
- 각 모형은 해당 화면(재료 입력, 추천 결과, 결과 화면)을 만들 때 그 작업이 이 영역에 채운다. 3장에는 그때 결과 예시(두부 300g)를 넣는다. 지금 `copy.intro`의 `exampleLabel`, `exampleIngredient`, `exampleMeals`, `exampleLeftover`는 쓰지 않지만 그 작업이 쓸 수 있게 둔다
- 큰 문구와 모형 영역을 합쳐 캐러셀(3:2) 안에 들어가야 한다. 360px 폭에서 큰 문구가 세 줄이 되는지 확인한다

### 다람쥐

제목 옆의 `default`와 별개로, 장마다 `Mascot`을 하나 둔다. 장의 주인공이 아니라 영역 옆에 끼어 있는 작은 장식이다. `alt`는 비운다.

- 영역(`Card`)의 오른쪽 아래 모서리에 걸쳐 놓는다. 크기는 120px이고 `absolute -right-6 bottom-1 -scale-x-100`이다. 좌우를 뒤집어 머리가 영역 안쪽을 향하고 꼬리가 모서리 쪽에 온다. 영역 밖으로 나가는 24px 중 그림의 투명 여백(오른쪽 약 12%, 120px에서 약 15px)을 뺀 약 9px만 그림이 영역 오른쪽 선을 넘는다
- 슬라이드 경계에서 잘리지 않는다. 영역 밖으로 나가는 부분은 투명 여백이라 슬라이드 밖으로 나가도(휴대폰에서는 영역 밖 간격이 16px) 그림이 잘려 보이지 않는다. 뒤집은 꼬리 끝도 그림의 투명 여백 안에 있어서 슬라이드 경계에서 잘리지 않는다. 이 예외는 소개에만 적용하고 `docs/design.md`에 적는다
- 위치는 세 장 모두 오른쪽 아래다. 모형을 채울 때 이 모서리(가로 약 110px, 세로 약 120px)에 내용을 두지 않는다
- 360px, 390px에서 큰 문구, 모형 영역과 겹치면 크기를 줄이거나 위치를 옮긴다

### 캐러셀

`embla-carousel-react`를 쓴다. 버전은 `8.6.0`으로 고정한다(`package.json`에 `^` 없이). `intro-carousel.tsx`가 `useEmblaCarousel`을 쓰고, 옵션은 `{ loop: false, align: 'start' }`다.

- 캐러셀 영역은 가로 3, 세로 2 비율이다(`aspect-3/2`). 가로는 앱 열 폭이고 최대 448px라서 세로는 360px 폭에서 240px, 448px 폭에서 약 299px다
- 끝에서 처음으로 돌아가지 않는다. 자동 재생은 없다
- 슬라이드는 `flex-[0_0_100%]`이고 한 번에 한 장이 보인다. 슬라이드 안 내용이 영역을 넘으면 그 슬라이드 안에서 세로로 스크롤한다(안전장치다)
- 스와이프와 마우스 드래그는 Embla가 처리한다. 세로 스크롤은 막지 않는다(Embla의 `touch-action: pan-y`)
- 동작 줄이기에서는 장이 바뀔 때 움직임 없이 바로 바뀐다. Embla에서 어떻게 끄는지(`duration` 옵션, `scrollTo(index, true)`)는 구현 때 문서로 확인한다

### 화살표 버튼

- 캐러셀 영역의 좌우 끝, 세로로는 보이는 장의 모형 영역 중앙에 맞춘다. 영역 위치가 문구 줄 수에 따라 장마다 달라서 `getBoundingClientRect`로 재서 `top`에 넣고, `ResizeObserver`로 크기 변화(글꼴 적용, 창 크기)에 따라 다시 잰다. 화살표는 `z-10`이라 다람쥐 위에 그려진다. 448px 열 안쪽 가장자리다. 마우스 환경에서는 슬라이드 좌우 안쪽 간격을 48px(`pointer-fine:px-12`)로 늘려 영역이 화살표 아래로 들어가지 않게 한다
- `Button variant="ghost" size="icon"`에 `ArrowLeft`, `ArrowRight`(lucide)를 쓴다. 터치 영역 44px
- 마우스 환경에서만 보인다: 기본은 `hidden`, `pointer-fine:` 변형으로 보인다. 휴대폰(`pointer: coarse`)에서는 그리지 않는다
- 첫 장에서는 이전, 마지막 장에서는 다음 버튼을 숨긴다(`pointer-fine:invisible`). 자리는 유지하고 화면 읽기와 포커스에서도 빠진다
- 화면 읽기 이름은 `copy.intro.prev`, `copy.intro.next`다

### 점 표시

- 캐러셀 아래 가운데에 장 수만큼 둔다. 모양은 현재 장이 꽉 찬 원, 나머지가 속이 빈 원(Ink 선)이다. 색이 아니라 채움 여부로 구분한다
- 점은 `button`이다. 누르면 그 장으로 이동한다. 눈에 보이는 원은 12px이고 누르는 영역은 가로 32px, 세로 44px이다. 점 사이를 좁히려고 가로를 44px에서 줄였다. 디자인 기준의 터치 영역 44px에는 가로가 못 미친다
- 현재 장의 점에 `aria-current="true"`를 단다. 화면 읽기 이름은 `copy.intro.goToSlide(n)`이다
- 키보드 사용자와 휴대폰 사용자는 점으로 장을 옮긴다. 화살표 버튼은 마우스 환경에서만 있기 때문이다

### 접근성

- 캐러셀 영역: `role="region"`, `aria-roledescription="carousel"`, `aria-label={copy.intro.carouselLabel}`
- 각 장: `role="group"`, `aria-roledescription="slide"`, `aria-label={copy.intro.slideLabel(현재, 전체)}`
- 보이지 않는 장의 내용은 화면 읽기가 읽지 않도록 `aria-hidden`과 `inert`를 단다. 보이는 장은 Embla가 알려 주는 현재 장(`selectedScrollSnap`)으로 정한다
- 장이 바뀌어도 포커스를 옮기지 않는다. 장 안에 눌러지는 것이 없다

### 시작 버튼

```tsx
const router = useRouter();
const start = () => {
  markVisited();
  router.replace('/');
};
```

- `Link`를 쓰지 않는다. `/`로 가는 `Link`는 쿠키를 쓰기 전에 프리페치한 리다이렉트 응답을 남길 수 있다(`app-foundation.md` "첫 방문").
- `markVisited()`가 쿠키를 쓴 뒤 `router.replace('/')`를 부른다. 소개는 기록에 남지 않아서 시작 홈에서 뒤로 가도 소개로 돌아오지 않는다.
- 버튼은 `button` 요소다. 키보드(Enter, Space)로 눌린다.
- 쿠키 없이 `replace('/')`가 `proxy.ts`에서 다시 `/intro`로 가는 일은 없다. 쿠키를 쓰는 동작이 먼저 끝나기 때문이다. 쿠키를 막은 브라우저에서는 소개와 시작 홈을 오갈 수 없어서 `/`로 가면 소개로 돌아온다. 이 경우를 따로 다루지 않는다.

## 시작 홈

머리글, 주황 상단 면, Light 영역이다.

주황 상단 면: `surface-brand` 안에 머리글과 제목 영역을 둔다. 제목 영역의 구조와 클래스는 소개의 제목 영역(`intro-page.tsx`)과 같고, 설명 자리에 시작 안내(`copy.home.guide`, `text-xl`)를 둔다. 물음표(`mascot.question`)도 소개와 같다.

- 제목 `h1`: `copy.home.title`, `font-display text-display-sm whitespace-pre-line`(28px). 문구의 `
`이 줄바꿈이 되도록 `whitespace-pre-line`이 필요하다. 제목을 `flex flex-col gap-4` 열에 둔다
- 다람쥐: `Mascot pose="default"`, 150px, `alt` 비움, `priority`. `relative -ml-4 shrink-0` 틀에 두고 이미지에 `mr-4`를 준다. 물음표는 같은 틀 안에서 `absolute top-0 right-0`이다. 제목 옆에 겹치지 않고 나란히 둔다
- 제목 영역 바깥 틀은 `flex flex-col gap-1 px-(--page-gutter) pt-4 pb-4`, 안쪽 줄은 `flex items-center gap-2`다. 소개를 고치면 같이 고친다
- 360px 폭에서 제목이 두 줄로 나뉜다. 시작 홈의 "직접 고르기"는 360×560에서 298px 높이에 있어 스크롤 없이 보인다

Light 영역: 구역 사이 24px.

주 행동: `Link`에 `buttonVariants({ size: 'primary' })` 클래스를 준다. `Button asChild`는 서버 컴포넌트에서 `onClick`을 `Link`에 넘겨 빌드가 실패하므로 쓰지 않는다. 문구 `copy.home.pickDirectly`, 오른쪽에 `ArrowRight`. 이동하는 곳은 `/ingredients?sheet=ingredient-picker`다. 위 "사용자와 정한 것"의 시트 이름을 `shared`가 아니라 `_pages/home`의 상수 하나로 둔다

`/ingredients`로 가는 `Link`는 프리페치해도 된다. 그 주소는 리다이렉트하지 않는다.

시작 홈은 입력을 받지 않고 입력 상태(`useInventory`)를 읽지 않는다. 재료 입력에서 뒤로 오면 홈이 다시 보이고 담은 재료는 스토어에 그대로 있다.

## 첫 화면 높이

시작 홈에서 "직접 고르기"는 스크롤 없이 보여야 한다. 기준 높이를 360×640으로 잡고, 더 낮은 360×560에서도 보이는지 확인한다. 보이지 않으면 상단 면의 위아래 간격과 다람쥐 크기를 줄인다. 글자를 줄이지 않는다.

소개는 시작 버튼이 맨 아래에 고정돼 어느 장에서든 스크롤 없이 보인다. 360×640에서 머리글, 제목과 설명, 캐러셀(240px), 점 표시, 시작 버튼을 합친 높이가 640px 안에 들어가 점 표시와 시작 버튼이 같이 보인다. 더 낮은 화면과 노트북에서 넘치면 페이지가 스크롤되고 시작 버튼은 화면 아래에 붙어 있다. 모자라면 제목 크기 대신 간격과 다람쥐 크기를 줄인다. 글자를 줄이지 않는다.

## 임시 확인 화면 정리

- `foundation-preview.tsx`를 지운다. 이 파일의 `Suspense` 감싸기도 같이 지운다. 시작 홈은 `useSearchParams`를 쓰지 않는다
- `docs/specs/app-foundation.md`의 "확인용 화면" 절은 이 파일을 가리키므로 지운다. 커밋 순서 8번의 문구도 맞춘다

공통 컴포넌트를 눈으로 확인하던 항목(시트, 스피너, 상태 메시지)은 재료 입력과 결과 화면이 실제로 쓰므로 이 작업에서 대신 만들지 않는다.

## 문서 반영

| 문서 | 고칠 곳 |
| --- | --- |
| `docs/requirements/onboarding.md` | 소개 구성 표를 "머리글, 제목과 설명, 캐러셀(장 3개), 점 표시, 하단 고정 시작 버튼"으로 바꾼다. 결과 예시는 3장의 화면 모형이 채운다고 적는다. 확인 기준에 "시작 버튼이 모든 장에서 보인다"를 더한다. 그리고 "시작 홈에서 재료 입력으로 가도 담은 재료가 유지된다"를 더할지 사용자와 정한다. 지금은 재료 입력 화면이 있어야 확인할 수 있다 |
| `docs/specs/app-foundation.md` | 위 "임시 확인 화면 정리" |
| `docs/copy.md` | 소개 절에 캐러셀 문구를 더한다: 캐러셀 이름 `서비스 소개`, 장 이름 `{전체}장 중 {현재}번째`, 단계 라벨 `{n}단계`, 이전 `이전`, 다음 `다음`, 점 `{n}번째 장으로 이동` |
| `docs/design.md` | 다람쥐 표에서 `discovery`, `thinking`, `meal`의 쓰는 곳에 소개를 더하고, 소개에서만 다람쥐가 영역의 오른쪽 아래 모서리에 걸쳐 영역의 선을 넘어도 된다고 적는다. 머리글을 포함해 화면 전체를 주황 면으로 쓰는 것도 적는다 |
| `package.json` | `embla-carousel-react@8.6.0` 의존성 |

## 테스트

컴포넌트 테스트는 파일 첫 줄 주석으로 jsdom을 쓴다.

- `StartButton`: 누르면 `markVisited`가 먼저, `router.replace('/')`가 나중에 불린다. `router.push`는 불리지 않는다
- `IntroPage`: `/`로 가는 링크(`a[href="/"]`)가 없다. 다람쥐 `alt`가 비어 있고 장 수만큼 있다. 제목, 설명, 머리글 쪽 다람쥐가 나오고 장 세 개에 `copy.intro.steps` 세 개가 나온다. 화면 모형 영역 세 개가 있고 `aria-hidden`이다
- `IntroCarousel`: jsdom에는 Embla가 쓰는 브라우저 API가 없으므로 `embla-carousel-react`를 가짜 API로 바꿔서 확인한다. 이전, 다음 버튼이 `scrollPrev`, `scrollNext`를 부르고 점이 `scrollTo(n)`을 부른다. 첫 장에서 이전, 마지막 장에서 다음이 `disabled`다. 현재 장의 점에 `aria-current`가 있고, 보이지 않는 장에 `aria-hidden`이 있다
- `HomePage`: "직접 고르기"가 `/ingredients?sheet=ingredient-picker`로 가는 링크다. 다람쥐 `alt`가 비어 있다
- `design-values.test.ts`가 새 파일의 임의 값을 걸러 준다

## 브라우저 확인

`npm run build && npm start`로 확인한다. `next dev`로 확인하지 않는다.

- 쿠키가 없는 상태에서 `/`를 열면 소개가 나오고, 응답이 307이다. 소개가 잠깐 보였다가 사라지는 화면이 없다
- 소개의 시작 버튼을 누르면 쿠키가 생기고 시작 홈이 나온다. 시작 홈에서 뒤로 가면 소개로 돌아가지 않는다
- 쿠키가 있으면 `/`가 바로 시작 홈이다. `/intro`를 직접 열면 소개가 나온다
- 360px, 390px, 1280px에서 제목과 다람쥐가 겹치지 않고 가로로 넘치지 않는다. 시작 홈의 다람쥐는 잘리지 않는다. 소개의 다람쥐도 몸과 꼬리가 잘리지 않는다
- 360×560에서 시작 홈의 "직접 고르기"가 보인다. 360×640에서 소개의 시작 버튼과 점 표시가 같이 보인다. 캐러셀이 3:2 비율이다(360px 폭에서 360×240, 1280px 폭에서 448×약 299)
- 소개: 터치 기기 흉내로 좌우 스와이프하면 장이 넘어가고, 세로 스크롤이 막히지 않는다. 마우스 환경(1280px)에서는 좌우 끝 화살표와 드래그로 넘어가고, 터치 기기 흉내에서는 화살표가 보이지 않는다. 시작 버튼은 모든 장에서 같은 자리에 보인다
- 소개: 키보드만으로 점 표시를 눌러 장을 옮길 수 있고, 포커스 표시가 보인다
- 키보드만으로 시작 버튼과 "직접 고르기"를 누를 수 있고 포커스 표시가 보인다
- 동작 줄이기에서 버튼 색 변화가 0ms이고, 장이 움직임 없이 바뀐다
- 낭만있구미체로 쓴 문구에 빈 글자가 없다. 두 제목, 단계 문구 세 개, "단계"의 한글은 `gumi-romance-hangul.txt`에 모두 있다(확인함)
- `/ingredients`는 재료 입력 작업이 만든다. 그 페이지가 이 브랜치에 없는 동안은 링크의 `href`만 확인하고, 합친 뒤 시트가 열리고 뒤로가기로 시작 홈에 돌아오는지 확인한다. 시트가 열린 채 도착하면 `useSheetRoute`는 앞 기록이 없다고 보고 닫을 때 쿼리만 지우므로(`replaceState`), 닫은 뒤 뒤로가기는 시작 홈으로 간다

## 범위 밖

- 재료 입력 화면과 시트: 세션 C가 만든다. 재료 입력 쪽 파일은 고치지 않는다
- 영수증으로 넣기 동작
- 로고 파일: 오기 전까지 머리글은 "탈탈" 글자다
- 실제 휴대폰 확인: 전체 점검에서 한다

## 완료 기준

- `docs/requirements/onboarding.md`의 확인 기준을 지킨다. 재료 유지는 합친 뒤에 확인한다
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`가 통과한다
- `fsd-review`에서 층 위반이 없다
- `foundation-preview.tsx`가 남아 있지 않다
