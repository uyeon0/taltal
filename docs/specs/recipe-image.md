# 레시피 이미지 저장 구현 스펙

레시피 상세 시트에서 지금 보는 요리 하나를 PNG 이미지로 저장하는 기능의 구현 방법을 정한다. 요구사항은 `docs/requirements/recipe-detail.md`의 "이미지로 저장"이다. GitHub 이슈는 #20, Notion 태스크는 PROJ1-130이다.

## 사용자와 정한 것

| 항목 | 정한 것 |
| --- | --- |
| 이미지 내용 | "N번째 요리", 요리 이름, 조리 시간, 요약, 재료와 양, 만드는 법과 팁, 서비스 이름과 주소, 레시피 출처 |
| 재료 그림 | 넣지 않는다 |
| 저장 방식 | 아이폰, 아이패드에서 파일 공유를 지원하면 공유 시트, 아니면 PNG 다운로드. 안드로이드와 PC는 공유를 지원해도 다운로드한다 |
| 서비스 주소 | 도메인을 아직 정하지 않았다. 주소를 한 곳에 두고, 정하기 전에는 서비스 이름만 쓴다 |
| 레시피 출처 | "레시피 출처: 농림축산식품 공공데이터 포털" |
| 이미지용 글꼴 | 공식 배포본을 받아 둔다. SUIT는 GitHub 릴리스 v2.0.5의 `SUIT-otf.zip`, 낭만있구미체는 구미시 공식 페이지의 `낭만있구미체.zip`이다 |

## 흐름

1. 상세를 받으면 시트 아래 고정 영역의 "이미지로 저장" 버튼을 쓸 수 있다.
2. 버튼을 누르면 브라우저가 `POST /api/recipes/[id]/image`로 이 요리의 입력을 보낸다.
3. 서버는 데이터 파일에서 레시피, 상세, 재료를 읽고, 시트와 같은 `toRecipeDetailView`로 값을 만든 뒤 `ImageResponse`로 PNG를 그려 돌려준다.
4. 브라우저는 받은 PNG를 `File`로 만든다. 아이폰, 아이패드이고 `navigator.canShare({ files })`가 참이면 `navigator.share`로 공유 시트를 연다. 아니면 `<a download>`로 내려받는다.

## API

`POST /api/recipes/[id]/image`. 처리 함수는 `src/_app/api-routes/recipe-image.ts`에 두고, 루트 `app/api/recipes/[id]/image/route.ts`는 그 함수를 내보내기만 한다. `docs/architecture.md`의 라우트 표에 이 주소를 더한다.

요청 본문은 화면에만 있는 값만 담는다.

```ts
type Body = {
  day: number; // Meal.day
  uses: { ingredientId: string; grams: number }[]; // Meal.uses
  toBuy: string[]; // Meal.toBuy
  shoppingList: { ingredientId: string; grams: number; optional: boolean }[]; // Result.shoppingList
  units: Record<string, InputUnit>; // 재료 id → 사용자가 고른 단위
};
```

- 요리 이름, 조리 시간, 재료 목록, 요약, 만드는 법은 본문으로 받지 않고 서버가 `getRecipes`, `getRecipeDetail`, `getIngredients`로 읽는다. 그래서 이미지에 들어가는 글은 데이터 파일의 글과 고정 문구뿐이다. 본문의 재료 id는 `groupIngredients`가 레시피 재료 목록을 기준으로 돌기 때문에, 레시피에 없는 id는 이미지에 나오지 않는다.
- 서버는 본문과 레시피로 `Meal`을 만든다. `recipeId`는 주소의 id, `name`은 레시피 이름이다. `pantryNeeded`, `urgency`, `urgentIngredients`는 이미지에 쓰지 않으므로 빈 값으로 둔다.
- 레시피 번호 검사는 `GET /api/recipes/[id]`와 같은 규칙이다.
- 본문은 `readJsonBody`로 32KB까지만 읽는다. `day`는 1~5의 정수, `uses`, `toBuy`, `shoppingList`는 각각 100개 이하, 재료 id는 50자 이하, g은 0 이상 10,000,000 이하의 유한한 수, `units`의 값은 `INPUT_UNITS` 중 하나여야 한다. 상한은 `POST /api/candidates`의 상한과 같은 이유로 둔다. 어기면 400이다.
- 레시피나 상세가 없으면 404, 데이터를 읽지 못하면 `serverError`를 쓴다.
- 응답은 `Content-Type: image/png`이고 `Cache-Control: no-store`를 붙인다.
- `next.config.ts`의 `outputFileTracingIncludes`에 이 라우트가 읽는 글꼴 파일과 전역 CSS를 더한다. 데이터 파일은 이미 `/api/**`에 들어 있다.

## 이미지 그리기

### 위치

| 파일 | 담는 것 |
| --- | --- |
| `src/widgets/recipe-detail-sheet/ui/recipe-image.tsx` | `RecipeImage`. `RecipeDetailView`, 서비스 표시 이미지, 색을 받아 Satori용 JSX를 돌려준다. 인라인 style만 쓴다. SUIT에 없는 글자를 바꾸는 `toImageText`도 둔다 |
| `src/widgets/recipe-detail-sheet/index.server.ts` | 지금의 `toRecipeDetailView`, `RecipeDetailView`에 `RecipeImage`, `toImageText`, 요청 본문 타입 `RecipeImageRequest`를 더해 내보낸다 |
| `src/_app/fonts/image/` | 이미지용 글꼴 파일 |
| `src/_app/fonts/image-fonts.server.ts` | 글꼴 파일을 처음 부를 때 한 번 읽어 `ImageResponse`의 `fonts` 형식으로 돌려준다 |
| `src/_app/styles/image-colors.server.ts` | 전역 CSS의 `:root` 토큰에서 이미지 색을 꺼낸다 |
| `src/_app/api-routes/recipe-image.ts` | 요청 검사, 데이터 읽기, `ImageResponse` 생성 |

`RecipeImage`는 `'use client'`를 두지 않고 브라우저 API를 쓰지 않는다. 화면의 `RecipeDetailContent`는 Tailwind 클래스로 그려 Satori에서 쓸 수 없으므로 다시 쓰지 않는다. 화면과 이미지가 공유하는 것은 `RecipeDetailView`다.

### 글꼴

`ImageResponse`는 ttf, otf, woff만 읽고 가변 글꼴의 굵기를 고르지 못한다. 그래서 앱의 woff2와 별도로 다음 파일을 둔다. 파일은 받은 그대로 두고 고치지 않는다.

| 파일 | 출처 | 굵기 |
| --- | --- | --- |
| `SUIT-Regular.otf` | `SUIT-otf.zip` (v2.0.5) | 400 |
| `SUIT-Medium.otf` | 같음 | 500 |
| `SUIT-SemiBold.otf` | 같음 | 600 |
| `SUIT-Bold.otf` | 같음 | 700. 순서 태그에 쓴다 |
| `GumiRomance-Regular.otf` | `낭만있구미체.zip`의 `Gumi Romance.otf` (Version 1.000) | 400 |

`LICENSE-SUIT.txt`와 `NOTICE-GumiRomance.md`는 `src/_app/fonts/`에 이미 있다. `docs/design.md`의 폰트 파일 표와 NOTICE에 이 파일들을 더한다.

SUIT와 낭만있구미체를 한 `ImageResponse`의 `fonts`에 함께 넣으면 SUIT 600이 400으로 그려지고, "½봉지"처럼 SUIT에 없는 글자가 섞인 단어가 낭만있구미체로 그려졌다(로컬에서 그려 확인). 그래서 낭만있구미체는 서비스 이름 한 곳에만 쓰고, 따로 그린다.

1. 낭만있구미체만 넣은 `ImageResponse`로 서비스 이름(`SITE.name`)을 PNG로 그린다. 이미지에 쓰는 크기의 2배로 그린다.
2. 그 PNG를 data URI로 바꿔 본 이미지의 `<img>`에 넣는다.
3. 본 이미지는 SUIT 네 굵기만 넣고 그린다.

서비스 이름 이미지는 요청과 상관없으므로 처음 한 번 그린 뒤 모듈 범위에 둔다.

### 크기

가로는 1080px이다. 세로는 내용에 맞춘다. `ImageResponse`는 `height`를 빼면 630px로 그리고, `height: undefined`를 넘기면 내용 높이로 그린다(로컬에서 확인). 그래서 `height: undefined`를 명시한다.

### 구성

앱의 주황 바탕과 Light 카드 인상에 맞춘다. 모든 크기는 시트의 값에 2.2를 곱해 반올림한 값이다. 예를 들어 시트의 3px 선은 7px, 카드 라운딩 20px은 44px이다. 2.2배 이미지를 휴대폰 화면 폭(390px)에 맞춰 보면 본문 글자가 약 12.7px로 보인다. 실제 데이터로 그리면 높이는 짧은 레시피가 2103px, 가장 긴 레시피가 3539px이다(디자인 점검 세션의 비교 시안 기준).

| 색 | 값 | 쓰는 곳 |
| --- | --- | --- |
| `brand.primary` | `#FA8835` | 이미지 바탕 |
| `neutral.ink` | `#20211E` | 글자, 선, 순서 태그와 단계 번호의 면 |
| `neutral.light` | `#FAFAF7` | 카드 면, 순서 태그와 단계 번호의 글자 |
| `border.subtle` | `#CFD1C9` | 재료 무리 사이 구분선 |

이미지는 위에서 아래로 머리, 본문, 맺음이다.

#### 머리

머리는 주황 바탕 위에 둔다. 안쪽 여백은 위와 좌우 56px, 아래 48px이고, 아래에 이미지 폭 전체의 7px Ink 선을 둔다.

| 구성 | 모양 |
| --- | --- |
| "N번째 요리" | 알약 태그. Ink 면, 선 없음, 완전히 둥근 라운딩, 안쪽 여백 위아래 9px 좌우 26px. Light 글자 31px 700 |
| 요리 이름 | 53px 600, 행간 1.3 |
| 조리 시간 | 31px 400 |
| 요약 | 35px 400 |

#### 본문

본문은 재료 절과 만드는 법 절을 각각 Light 카드에 담는다. 본문 바깥 여백은 위아래 48px 좌우 56px, 카드 사이는 35px이다. 카드는 7px Ink 선, 라운딩 44px, 안쪽 여백 위아래 42px 좌우 48px이다.

| 카드 | 구성 | 모양 |
| --- | --- | --- |
| 재료 | 제목 "이 요리에 쓰는 재료" | 44px 600 |
| 재료 | 무리 소제목 | 35px 600 |
| 재료 | 재료 줄 | 이름 35px 400, 양은 오른쪽 끝에 35px 500 |
| 재료 | 무리 사이 | 35px 간격과 3px Subtle 선 |
| 재료 | "따로 사야 해요" 상자 | 7px Ink 선, 라운딩 18px, 안쪽 여백 위아래 18px 좌우 26px |
| 만드는 법 | 제목 "만드는 법" | 44px 600 |
| 만드는 법 | 단계 | 35px 400, 단계 사이 26px |
| 만드는 법 | 단계 번호 | 지름 62px 원. Ink 면, Light 숫자 31px 600 |
| 만드는 법 | 팁 | 31px |

#### 맺음

맺음은 주황 바탕 위에 둔다. 위에 이미지 폭 전체의 7px Ink 선을 두고, 안쪽 여백은 56px이다. 서비스 이름 이미지는 높이 44px로 넣고, 레시피 출처는 31px 400이다. 출처는 주황 바탕 위에 있으므로 Muted가 아니라 Ink로 쓴다(`docs/design.md`의 "주황 면의 글자" 규칙).

- 사선 모서리(`clip-path`)와 CSS grid는 쓰지 않는다. Satori가 지원하지 않는다. 위 모양은 flex, 테두리, 라운딩으로 그린다.
- "따로 사야 해요" 상자에는 시트의 장바구니 아이콘을 넣지 않는다.
- 양념 소제목은 시트와 같이 "양념 · 원문 N인분 기준"이다.
- 원문 분량 접기는 넣지 않는다.
- 서비스 주소는 `SITE.url`을 쓴다. 지금은 `null`이고, `null`이면 서비스 이름만 쓴다.
- 크기 값은 `RecipeImage` 파일 안 상수로 둔다.
- Satori는 CSS 변수를 읽지 못하고, `design-values` 테스트는 코드에 HEX 색을 두지 못하게 막는다. 그래서 서버가 `src/_app/styles/globals.css`의 `:root`에서 `--primary`(바탕), `--foreground`(Ink), `--card`(Light), `--border`(Subtle) 값을 읽어 `RecipeImage`에 `colors`로 넘긴다. 처음 부를 때 한 번 읽는다.
- "팁"과 팁 내용은 한 문단처럼 이어 접혀야 한다. Satori에는 인라인 문단이 없으므로 "팁"과 낱말을 따로 둔 `flex-wrap` 줄로 그린다.

### SUIT에 없는 글자

`ImageResponse`는 넣어 준 글꼴에 없는 글자를 만나면 Google Fonts에서 글꼴을 받아 오려 한다. 이 동작은 끌 수 없다. 받지 못하면 빈 네모로 그린다. 그래서 데이터에서 온 글은 모두 `toImageText`로 바꾼 뒤 그린다. 시트는 브라우저가 시스템 글꼴로 대신 그리므로 바꾸지 않는다.

| 글자 | 이미지 표기 | 나오는 곳 |
| --- | --- | --- |
| `⅓`, `⅔` | `1/3`, `2/3` | `formatAmount`의 양 |
| `㎝`, `∼` | `cm`, `~` | 만드는 법 |
| `？`(전각) | `?` | 원본에서 깨진 한글 자리. 레시피 3개 |
| 한자만 든 괄호 | 괄호째 뺀다 | 레시피 65번 팁의 "나복저(蘿 菹)" |

실제 데이터의 모든 글자를 `toImageText`로 바꿔 SUIT로 그릴 때 글꼴을 내려받으려 하지 않는지 테스트로 확인한다. 데이터에 새 글자가 들어와 테스트가 실패하면 이 표에 더한다.

## 시트

### 저장 버튼

- `RecipeDetailSheet`가 `BottomSheet`의 `footer`에 "이미지로 저장" 버튼을 둔다. 주요 버튼 모양이다.
- 상세를 받기 전이나 받지 못했을 때는 `disabled`다.
- 누르면 이미지를 받는 동안 버튼 글자를 "이미지를 만들고 있어요"로 바꾸고 `Button`의 `loading`으로 둔다. 두 번 눌러 요청이 겹치지 않게 한다.
- 실패하면 버튼 위에 오류 안내를 둔다. 다시 누르면 안내를 지운다. 시트를 닫거나 다른 요리로 바뀌면 진행 중인 요청을 끊고 상태를 처음으로 돌린다.

### 저장 로직

`src/widgets/recipe-detail-sheet/model/save-recipe-image.ts`에 둔다.

- `requestRecipeImage(recipeId, body, signal)`: API를 부르고 PNG `Blob`을 돌려준다. 응답이 성공이 아니면 오류를 던진다.
- `saveImage(blob, fileName)`: `File`을 만들고, 아이폰, 아이패드이면서 `navigator.canShare?.({ files: [file] })`가 참이면 `navigator.share({ files: [file] })`를 부른다. 아이폰, 아이패드는 `navigator.userAgent`의 `iPhone`, `iPad`, `iPod`로 판단하고, 아이패드는 맥으로 알리므로 `Macintosh`이면서 `navigator.maxTouchPoints`가 1보다 크면 아이패드로 본다. iOS는 내려받은 이미지를 파일 앱에 두므로 사진 앱에 저장하려면 공유 시트를 거쳐야 한다. 안드로이드는 내려받으면 다운로드 폴더에 저장되고 갤러리에서도 보이므로 바로 내려받는다. Windows의 Chrome과 Edge는 파일 공유를 지원하지만 그 공유 창에는 파일로 저장하는 항목이 없어서 PC도 바로 내려받는다(Windows에서 확인). 사용자가 공유 시트를 닫아 `AbortError`가 나면 조용히 끝낸다. `NotAllowedError`가 나면 다운로드로 넘어간다. 공유를 지원하지 않으면 object URL과 `<a download>`로 내려받고 URL을 해제한다.
- 파일 이름은 `${SITE.name}-${요리 이름}.png`다. 파일 이름에 쓸 수 없는 문자(`\/:*?"<>|`)는 `-`로 바꾼다.

`navigator.share`는 사용자 동작 직후에만 부를 수 있다. 서버 응답을 기다리는 사이 이 조건이 풀리면 `NotAllowedError`가 난다. 그래서 그 경우 다운로드로 넘어가게 둔다. 실제 휴대폰에서 응답 시간 안에 공유 시트가 열리는지는 확인 기준에서 본다.

시트는 열 때 결과 화면에서 이미 `meal`, `shoppingList`, `units`를 받으므로 props는 바뀌지 않는다.

## 문구

`copy.recipeSheet`와 `docs/copy.md`의 "레시피 상세 시트" 표에 더한다.

| 자리 | 문구 |
| --- | --- |
| 저장 버튼 | 이미지로 저장 |
| 이미지 만드는 중 | 이미지를 만들고 있어요 |
| 이미지 오류 | 이미지를 만들지 못했어요. 다시 눌러 주세요. |
| 레시피 출처 | 레시피 출처: 농림축산식품 공공데이터 포털 |

## 테스트

| 파일 | 확인하는 것 |
| --- | --- |
| `src/_app/api-routes/recipe-image.test.tsx` | 잘못된 번호와 본문은 400, 없는 레시피는 404. 실제 데이터가 있으면 PNG를 돌려주고 가로가 1080px다. 실제 데이터의 모든 글자를 그릴 때 글꼴을 내려받으려 하지 않는다 |
| `src/widgets/recipe-detail-sheet/ui/recipe-image.test.ts` | `toImageText`가 표의 글자를 바꾸고 ½ ¼ ¾는 그대로 둔다 |
| `src/_app/styles/image-colors.test.ts` | 전역 CSS의 토큰에서 이미지 색을 꺼내고, 토큰이 없으면 오류를 던진다 |
| `src/widgets/recipe-detail-sheet/model/save-recipe-image.test.ts` | 공유를 지원하면 `share`를 부르고, 지원하지 않거나 `NotAllowedError`면 내려받고, `AbortError`는 조용히 끝낸다. 파일 이름의 금지 문자를 바꾼다 |
| `src/widgets/recipe-detail-sheet/ui/recipe-detail-sheet.test.tsx` | 상세를 받기 전에는 버튼이 꺼져 있다. 누르면 요청 본문에 `day`, `uses`, `toBuy`, `shoppingList`, `units`가 들어간다. 실패하면 안내가 보인다. 닫으면 요청을 끊는다 |
| `src/_app/fonts/fonts.test.ts` | 이미지용 글꼴 파일이 있고, 서비스 이름의 글자가 낭만있구미체 지원 글자 목록에 있다 |

## 확인 기준 점검

| 확인 기준 | 방법 |
| --- | --- |
| 이미지의 재료 양과 만드는 법이 시트와 같다 | 시트와 이미지가 같은 `toRecipeDetailView` 값을 쓴다. 실제 데이터로 이미지를 몇 장 그려 시트와 눈으로 비교한다 |
| 낭만있구미체와 SUIT가 빈 글자 없이 나온다 | "½" 같은 분수 기호가 든 양과 600 굵기가 든 레시피로 그린 이미지를 눈으로 본다 |
| Android Chrome과 iOS Safari에서 저장된다 | 사용자가 휴대폰에서 확인한다. 개발 서버를 같은 네트워크에서 열거나 Vercel 미리보기 배포를 쓴다 |

## 확인하지 못한 것

- 낭만있구미체 이용 조건은 형식 변환과 재배포를 따로 언급하지 않는다. 이번 파일은 공식 배포본 그대로라 형식 변환은 없다.
- Vercel에서 이미지 한 장을 그리는 시간은 재지 않았다. 로컬 개발 서버에서는 가장 긴 레시피(9단계)가 처음 요청에 1.5초, 짧은 레시피가 0.12초 걸렸다. 처음 요청은 글꼴을 읽고 서비스 이름을 그리는 시간이 더해진다.
