# 브랜드 이미지 교체

다람쥐 그림, 파비콘, 공유 이미지를 새로 확정한 그림으로 바꾼다. 앱에서 쓰는 파일만 넣는다.

함께 이미지 스크립트가 읽는 입력을 앱 저장소가 정한 폴더 형식으로 바꾼다. 지금 스크립트와 문서는 개인 작업 폴더의 경로, 폴더 이름, 시안 번호가 붙은 파일 이름을 알고 있다. 앞으로 앱 저장소는 입력 폴더의 형식만 알고, 그림을 고르고 모으는 일은 앱 밖에서 한다.

## 입력 폴더 형식

`scripts/build-image-assets.mjs`는 아래 모양의 폴더 하나를 인자로 받는다. 파일 이름이 곧 앱의 식별자다.

```
<입력 폴더>/
  mascot/
    default.png      소개, 시작 홈
    discovery.png    빈 재료 목록
    thinking.png     계산 중
    meal.png         결과 도입부
    retry.png        추천 없음, 오류
  brand/
    favicon.ico
    favicon-32x32.png
    apple-touch-icon.png
    opengraph-image.png
  ingredients/
    <그림 파일>.png
  ingredients.json
```

- `mascot/*.png`, `ingredients/*.png`는 정사각형 투명 PNG다. 크기는 묻지 않는다. 스크립트가 다람쥐는 640px, 재료 그림은 256px로 줄인다.
- `brand/`의 파일은 줄이지 않고 그대로 복사한다. `apple-touch-icon.png`는 180×180, `opengraph-image.png`는 1200×630이어야 한다. 크기가 다르면 스크립트가 멈춘다.
- `ingredients.json`은 재료 ID와 그림 파일을 잇는다.

  ```json
  {
    "ingredients": { "두부": "tofu.png", "대파": "green-onion.png" },
    "fallback": "paper-bag.png"
  }
  ```

  파일 이름은 `ingredients/` 안의 이름이다. 비슷한 재료는 같은 파일을 쓸 수 있다.
- 스크립트는 파일이 모두 있는지 먼저 확인하고, 하나라도 없으면 출력 폴더를 지우기 전에 멈춘다.
- 원본의 해시 확인, 시안 선택 기록은 입력 폴더를 만드는 쪽에서 한다. 앱 저장소는 받은 파일을 그대로 쓴다.

## 이번에 넣는 그림

| 식별자 | 그림 |
| --- | --- |
| `mascot.default` | 토마토를 든 기본형에 물음표를 합친 그림 |
| `mascot.discovery` | 재료 발견 |
| `mascot.thinking` | 고민 중 |
| `mascot.meal` | 요리 제안 |
| `mascot.retry` | 다시 해보자 |
| 파비콘, Apple 아이콘 | 바구니를 기울이는 다람쥐를 주황 바탕에 둔 아이콘 |
| 공유 이미지 | 서비스 이름과 요리하는 다람쥐를 주황 바탕에 둔 1200×630 이미지 |

- `mascot.default`는 물음표를 합친 그림이다. 지금은 다람쥐와 물음표(`mascot.question`)를 겹쳐 그리는데, 그림 하나로 바꾸면서 `mascot.question`과 겹쳐 그리는 코드를 지운다.
- 쓰는 곳이 없는 그림은 넣지 않는다.
- 재료 그림은 바꾸지 않는다. 입력 형식이 바뀌므로 지금 그림을 새 형식으로 모아 다시 실행하고, 결과가 지금 커밋된 파일과 같은지 확인한다.

## 구현

| 파일 | 바꿀 내용 |
| --- | --- |
| `scripts/build-image-assets.mjs` | 입력 폴더 형식을 읽는다. 다람쥐와 재료 그림은 줄이고, `brand/`는 크기를 확인한 뒤 복사한다. 개인 폴더의 경로, 파일 이름, 데이터 해시 비교를 지운다 |
| `src/shared/assets/index.ts` | `MASCOT_IMAGES`에서 `question`을 뺀다. `BRAND`의 파비콘 경로를 새 파일로 바꾼다 |
| `src/_app/layout/root-layout.tsx` | `icons`에 `favicon.ico`와 32px PNG를 함께 넣는다 |
| `src/_pages/intro/ui/intro-page.tsx`, `src/_pages/home/ui/home-page.tsx` | 물음표를 겹쳐 그리던 `Mascot`을 지운다 |
| `app/opengraph-image.tsx`, `src/_app/og-image/` | 코드로 그리던 공유 이미지를 지우고, 같은 자리에 `app/opengraph-image.png`(정적 파일)를 둔다. 대체 텍스트는 `app/opengraph-image.alt.txt`에 지금과 같은 문구로 둔다 |
| `src/_app/styles/globals.css` | `--mascot-question-size`를 지운다 |
| `public/images/mascot/question.png`, `public/brand/favicon.png` | 지운다 |

- `app/opengraph-image.png`는 `public/`이 아니라 `app/`에 있다. 스크립트가 `brand/opengraph-image.png`를 이 자리로 복사한다.
- 다람쥐 크기와 제목 영역 배치는 이 작업에서 바꾸지 않는다. 새 그림으로 보이는 모습은 화면 레이아웃 보정(#54)에서 맞춘다.
- `image-fonts.server.ts`, `image-colors.server.ts`는 레시피 이미지가 계속 쓰므로 남긴다.

## 바꿀 문서

개인 작업 폴더를 가리키는 설명을 모두 걷어 내고, 앱 저장소가 정한 형식으로 쓴다.

| 문서 | 바꿀 내용 |
| --- | --- |
| `docs/design.md` | "그림"의 원본 설명을 입력 폴더 형식으로 바꾼다. "다람쥐" 표에서 원본 파일 이름 열과 `mascot.question` 행, 크기 규칙의 물음표 문장을 지운다. "공유 이미지"를 정적 PNG로 바꾼다 |
| `docs/specs/app-foundation.md` | "이미지 자산"과 폰트 파일의 출처 설명에서 개인 폴더 경로를 지운다 |
| `docs/specs/share-preview.md` | 공유 이미지를 코드로 그린다는 설명 |
| `docs/architecture.md` | 재료 그림 경로 표를 만드는 스크립트 설명이 새 형식과 맞는지 확인한다 |

## 확인

- lint, 타입 검사, 테스트, `fsd-review`
- 재료 그림만 새 형식으로 모아 스크립트를 돌렸을 때, `public/images/ingredients/`와 `ingredient-images.ts`가 지금과 같다
- 입력 폴더에서 파일 하나를 빼면 스크립트가 출력 폴더를 건드리지 않고 멈춘다
- 웹 빌드와 미니앱 빌드가 성공하고, 미니앱 결과물에 새 공유 이미지와 파비콘이 들어 있다
- 휴대폰 폭 브라우저에서 소개, 시작 홈, 빈 재료 목록, 계산 중, 결과, 추천 없음의 다람쥐가 새 그림이다
- 브라우저 탭의 파비콘이 새 그림이다
- `/opengraph-image.png`가 새 공유 이미지를 돌려준다
- `docs/`, `scripts/`에 개인 작업 폴더의 경로나 이름이 남아 있지 않다
