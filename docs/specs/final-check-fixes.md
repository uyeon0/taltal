# 전체 점검 수정

전체 점검(#9)에서 나온 문제 중 휴대폰에서도 생기는 4건을 고치고, 결과 화면의 헤더를 위에 붙인다. 이 스펙은 화면 문구 하나(화면별 브라우저 탭 제목)를 새로 정하고, 나머지는 기존 요구사항에 맞춰 고친다.

- 이슈: #29 전체 점검 수정
- Notion 태스크: PROJ1-71, PROJ1-72
- 기준 문서: `docs/design.md`의 "버튼", "공간과 형태", `docs/requirements/onboarding.md`의 "소개"와 확인 기준, `docs/requirements/results.md`, `docs/requirements/foundation.md`의 "앱 영역", `docs/copy.md`
- 브랜치: `fix/final-check`. `origin/main`의 `43ef176`에서 분기했다
- 공유 미리보기(OG 이미지와 `metadataBase`)는 이 스펙에 넣지 않는다. 같은 `root-layout.tsx`를 고치므로 커밋을 나누고, 스펙은 따로 쓴다

## 점검에서 확인한 것

배포본(`taltal.vercel.app`, main `43ef176` 이후)을 데스크톱 브라우저로 본 결과다. 휴대폰은 보지 못했다.

| 번호 | 화면 | 확인한 내용 |
| --- | --- | --- |
| 1 | 소개 | 장 이동 점 버튼이 폭 32px, 높이 44px이다. `src/shared/ui/carousel.tsx`의 점 버튼이 `w-8`이다 |
| 2~4 | 소개 | 마우스 환경의 좁은 창에서만 생긴다. 아래 "고치지 않는 것"에 있다 |
| 5 | 결과 키보드 | 가짓수 탭 다음에 이름 없는 탭 패널(`tabindex=0`)이 Tab 정지점이 된다 |
| 6 | 결과 오류 | 누른 "요리 찾기" 버튼이 사라지면서 포커스가 `body`로 빠진다. 알림(`role="alert"`)은 읽힌다 |
| 7 | 모든 화면 | `document.title`이 모두 "탈탈"이다 |

## 고치지 않는 것

점검 2~4번(소개 360×640의 16px 스크롤, 2장 미리보기 줄 구성, 3장 제목 줄바꿈)은 고치지 않는다. 처음 점검은 마우스가 있는 브라우저의 좁은 창에서 했고, 이때 소개 장은 화살표 자리 때문에 좌우 안쪽 여백이 48px이다(`pointer-fine:px-12`). 휴대폰에서는 16px이다. 마우스 환경의 좁은 창에서 모형이 길어질 수 있다는 점은 `docs/requirements/onboarding.md`의 확인 기준이 이미 적고 있다.

장의 좌우 안쪽 여백을 16px로 덮어 휴대폰 환경을 흉내 내 다시 쟀다. 휴대폰 터치 환경은 아니다.

| 폭×높이 | 문서 높이 | 장 제목 줄 수(1, 2, 3장) |
| --- | --- | --- |
| 360×640 | 640px(스크롤 없음) | 1, 2, 2 |
| 390×844 | 844px(스크롤 없음) | 1, 1, 1 |

2장의 세 줄도 한 줄씩이다(마우스 환경에서는 둘이 두 줄이 된다). 실제 휴대폰 확인은 사용자가 한다. 360×640에서 문서 높이가 화면 높이와 같아 여유가 없으므로, 휴대폰에서 스크롤이 생기면 그때 고친다.

## 이 스펙에서 정한 것

사용자 확인이 필요한 항목이다.

| 번호 | 항목 | 결정 | 이유 |
| --- | --- | --- | --- |
| 1 | 점 버튼 폭 | `w-8`을 `w-(--control-height)`로 바꿔 44px로 한다. 보이는 점 크기(12px)는 그대로다 | `docs/design.md`가 모든 버튼의 터치 영역을 44px 이상으로 정한다. 점 사이 간격만 넓어진다 |
| 5 | 탭 패널 | `results-view.tsx`가 `TabsContent`에 `tabIndex={-1}`을 넘긴다 | 패널 안에 "재료별 사용량 보기"와 요리 카드 버튼이 있어 패널이 Tab 정지점일 필요가 없다. 이름 없는 정지점이 사라진다. Radix가 `tabIndex=0`을 기본으로 두므로 덮어쓰는 것이 되는데, 덮어써지는지 테스트로 확인한다 |
| 6 | 오류 포커스 | 오류와 추천 없음 화면이 나타났을 때 포커스가 `body`에 있으면 첫 행동 버튼("다시 찾기", 추천 없음에서는 "재료 수정하기")으로 옮긴다. 포커스가 이미 다른 곳에 있으면 옮기지 않는다 | 버튼이 사라져 포커스를 잃은 키보드 사용자가 처음부터 Tab을 다시 눌러야 한다. 알림은 이미 읽히므로 문구는 더하지 않는다 |
| 7 | 화면별 제목 | 아래 표의 제목을 쓴다. 루트 레이아웃의 `title`을 `default`와 `template`을 가진 객체로 바꾸고, 화면에서 `title`을 내보낸다. 시작 홈은 제목을 내보내지 않아 "탈탈"이다 | 브라우저 탭과 화면 읽기 프로그램에서 화면을 구분한다. 한 줄 설명은 화면마다 따로 두지 않고 루트의 것을 쓴다 |
| 8 | 결과 화면 헤더 | 결과 화면의 헤더를 스크롤해도 위에 붙인다. 아래에 3px Ink 선을 둔다. 바탕은 주황(`bg-background`)이고 시트 막(overlay)보다 아래 층이다 | 긴 목록에서 "재료 수정"이 스크롤로 사라진다. 소개와 시작 홈이 제목 영역 아래에 3px Ink 선을 두므로 같은 말로 쓴다. 다른 화면은 바꾸지 않는다 |
| 9 | 가려짐 방지 | `html`에 `scroll-padding-top: calc(var(--control-height) + 1.5rem)`(68px)를 준다 | 붙은 헤더에 포커스 받은 요소와 시트에서 돌아온 카드가 가려지지 않게 한다. 헤더가 없는 화면에도 적용되지만 포커스 이동 때 위쪽에 68px 여백이 더 생길 뿐이다. 헤더 높이는 재료 수정 버튼 46px, 위아래 여백 16px, 아래 선 3px을 더한 65px이다(구현할 때 쟀다) |

### 화면별 제목

| 화면 | 주소 | 탭 제목 | 상태 |
| --- | --- | --- | --- |
| 시작 홈 | `/` | 탈탈 | 지금과 같다 |
| 소개 | `/intro` | 서비스 소개 · 탈탈 | 새 문구, 사용자 확인함 |
| 재료 입력 | `/ingredients` | 재료와 양 넣기 · 탈탈 | 새 문구, 사용자 확인함 |
| 추천 결과 | `/results` | 추천 결과 · 탈탈 | 새 문구, 사용자 확인함 |

"서비스 소개"는 `docs/copy.md`의 소개 캐러셀 이름과 같은 말이다. "재료와 양 넣기"는 소개 1장의 "가진 재료와 양을 넣어요."에서 가져왔다. 말투 규칙에 어긋나는 말은 없다.

## 결과 화면 헤더

`ResultsSearch`가 그리는 `AppHeader`에 `className`을 넘긴다. `AppHeader`는 이미 `className`을 받으므로 공통 컴포넌트는 고치지 않는다.

```tsx
<AppHeader
  backHref={INGREDIENTS_HREF}
  backLabel={copy.results.editIngredients}
  className="sticky top-0 z-10 border-b border-foreground bg-background"
/>
```

- 헤더는 계산 중, 결과, 추천 없음, 오류 네 상태에서 모두 붙는다. 같은 `ResultsSearch`가 모든 상태의 헤더를 그리기 때문이다.
- 헤더의 부모(`flex min-h-dvh flex-col`)가 화면 전체 높이를 가지므로 `sticky`가 문서 스크롤에 붙는다.
- 시트는 `body` 아래 포털에 그려진다. 시트 막과 겹치는 순서는 구현할 때 `BottomSheet`의 `z-index`를 읽어 `z-10`이 아래에 오는지 확인한다. 위에 오면 `z` 값을 낮춘다.
- 계산 중과 오류는 내용이 화면 가운데에 있어 선이 위에 하나 더 보인다. 모습이 어색하면 사용자에게 묻는다.

## 오류 포커스

`ResultsSearch`에서 `state.status`가 오류이거나 `empty`가 참이 되는 순간에 한 번 실행한다. 행동 영역(`StatusMessage`의 `actions`) 안의 첫 `button`을 찾아 `focus()`를 부른다. 실행할 때 `document.activeElement`가 `document.body`일 때만 옮긴다.

- 행동 영역에 `ref`를 달 수 없으므로 `<main>`에 `ref`를 달아 `main.querySelector('[data-slot="status-message"] button')`로 찾는다. `StatusMessage`가 `data-slot="status-message"`를 이미 가진다는 점은 확인했다.
- `다시 찾기`를 눌러 다시 계산 중이 되었다가 같은 오류가 나면 다시 옮긴다. 실행 조건이 "상태가 오류가 되는 순간"이기 때문이다.
- 계산 중 상태는 건드리지 않는다. 기존 `LoadingStatus`의 동작을 그대로 둔다.

## 화면별 제목 구현

| 파일 | 내용 |
| --- | --- |
| `src/shared/copy/index.ts` | `copy.pageTitle`을 더한다: `intro`, `ingredients`, `results` |
| `src/_app/layout/root-layout.tsx` | `metadata.title`을 `default`는 `SITE.name`, `template`은 `%s · 탈탈`인 객체로 바꾼다. 서비스 이름은 `SITE.name`에서 가져온다. `openGraph.title`은 `SITE.name`으로 그대로 둔다 |
| `src/_pages/intro/model/metadata.ts` | `export const metadata: Metadata = { title: copy.pageTitle.intro }` |
| `src/_pages/ingredients/model/metadata.ts` | 재료 입력 제목 |
| `src/_pages/results/model/metadata.ts` | 추천 결과 제목 |
| `app/intro/page.tsx`, `app/ingredients/page.tsx`, `app/results/page.tsx` | 기존 한 줄에 `metadata`를 같이 내보낸다. 루트 `layout.tsx`가 이미 같은 방식이다 |

`Metadata` 타입은 `next`에서 가져온다. 페이지 모듈이 Next 타입을 import하는 것이 FSD 규칙에 어긋나는지는 `fsd-review`로 확인한다. `generateMetadata`와 `title.template` 동작은 `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`에서 확인했다. `title.template`은 같은 세그먼트의 `page`가 아니라 자식 세그먼트에 적용된다는 점이 있다. 루트 `layout.tsx`에서 정한 템플릿이 `app/intro/page.tsx` 같은 자식 `page`의 제목에 적용되므로 지금 구조에서 맞다. 그래도 `npm run build` 뒤 실제 `<title>`로 확인한다.

## 파일

| 파일 | 내용 |
| --- | --- |
| `src/shared/ui/carousel.tsx` | 점 버튼 `w-8`을 `w-(--control-height)`로 바꾼다 |
| `src/_pages/results/ui/results-view.tsx` | `TabsContent`에 `tabIndex={-1}` |
| `src/_pages/results/ui/results-screen.tsx` | 헤더 `className`, 오류 포커스 |
| `src/_app/styles/globals.css` | `html`의 `scroll-padding-top` |
| 화면별 제목 | 위 "화면별 제목 구현"의 파일 |

`src/shared/ui/tabs.tsx`는 고치지 않는다. 패널에 포커스할 요소가 없는 탭이 생기면 `tabIndex={-1}`이 맞지 않으므로 기본값으로 두지 않고, 쓰는 쪽(`results-view.tsx`)이 정한다.

## 테스트

| 파일 | 확인하는 것 |
| --- | --- |
| `shared/ui/carousel.test.tsx` | 점 버튼이 폭 44px 클래스를 갖는다 |
| `_pages/results/ui/results-screen.test.tsx` | 헤더가 `sticky`를 가진다. 오류에서 포커스가 `body`였으면 "다시 찾기"로 옮기고, 포커스가 다른 곳에 있으면 옮기지 않는다. 추천 없음에서는 "재료 수정하기"로 옮긴다 |
| `_pages/results/ui/results-view.test.tsx` | 탭 패널의 `tabindex`가 `-1`이다. 파일이 없으면 만든다 |
| 화면별 제목 | 세 `metadata`의 `title`이 `copy.pageTitle`과 같다 |

## 확인 방법

`npm run dev`로 띄우고 브라우저에서 확인한다.

- 소개가 360×640(좌우 안쪽 여백 16px로 흉내 낸 환경)에서 스크롤 없이 들어간다. 소개 화면은 이 스펙에서 코드를 바꾸지 않으므로 점 버튼 폭만 다시 본다.
- 장 이동 점 버튼이 폭, 높이 모두 44px 이상이다.
- 결과 화면에서 Tab을 누르면 재료 수정 → 가짓수 탭 → "재료별 사용량 보기" 순서로 가고 이름 없는 정지점이 없다.
- 결과 화면을 길게 스크롤해도 "재료 수정"이 보이고 눌린다. 요리 카드를 열었다 닫으면 그 카드가 헤더에 가려지지 않는다.
- 요청을 막아(네트워크 차단) 오류를 만들면 포커스가 "다시 찾기"에 있다.
- 화면마다 브라우저 탭 제목이 위 표와 같다.

그 뒤 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `fsd-review` 스킬로 점검한다. 휴대폰 확인(소개 360px, 헤더 고정, 키보드가 올라온 시트)은 사용자가 한다.

## 문서 반영

구현 전에 요구사항 문서를 먼저 고친다.

- `docs/requirements/results.md`: "결과 화면 구성"에 헤더가 스크롤해도 위에 붙는다는 항목을, 확인 기준에 "긴 목록에서도 재료 수정 버튼이 보인다"와 "오류가 나타나면 포커스가 첫 행동 버튼에 있다"를 더한다.
- `docs/requirements/onboarding.md`: 확인 기준에 "360×640에서 소개가 스크롤 없이 한 화면에 들어간다"를 더한다. 점 표시의 터치 영역은 `docs/design.md`가 이미 정하므로 더하지 않는다.
- `docs/requirements/foundation.md`: "앱 영역"의 "브라우저 탭의 제목과 설명" 항목을 화면마다 제목이 다르다는 내용으로 고친다.
- `docs/design.md`: "공간과 형태"에 결과 화면 헤더가 위에 붙고 3px Ink 선으로 나뉜다는 한 줄을 더한다.
- `docs/copy.md`: "화면 제목" 절을 더한다(위 표).
