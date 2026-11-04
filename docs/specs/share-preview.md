# 공유 미리보기

링크를 메신저나 SNS에 붙였을 때 보이는 미리보기에 OG 이미지(1200×630)를 더하고, 이미지 주소를 절대 주소로 만드는 `metadataBase`를 정한다. 이미지는 `next/og`로 빌드할 때 한 번 그린다.

- 이슈: #30 공유 미리보기. #29 전체 점검 수정과 같은 브랜치에서 커밋을 나눠 진행하고 같은 PR로 합친다
- 기준 문서: `docs/requirements/foundation.md`의 "앱 영역", `docs/design.md`의 "색", "서체", "그림", `docs/copy.md`, `docs/specs/recipe-image.md`(서버 이미지의 글꼴 처리)
- 브랜치: `fix/final-check`. 점검 수정 커밋 뒤에 쌓는다
- 확인하지 못한 것: 카카오톡과 Slack에서 보이는 모습. 배포 뒤 사용자가 휴대폰에서 확인한다

## 지금 상태

`src/_app/layout/root-layout.tsx`의 `metadata`에 `title`, `description`, `openGraph`(`title`, `description`, `siteName`, `locale`, `type`)가 있고, 이미지가 없다. `metadataBase`가 없으므로 이미지 주소를 절대 주소로 만들 수 없다. 서비스 주소는 `src/shared/config/site.ts`의 `SITE.url`(`taltal.vercel.app`, `https://` 없음)에 있다.

## 사용자와 정한 것

| 항목 | 결정 |
| --- | --- |
| 이미지 만드는 방법 | `next/og`(`ImageResponse`)로 빌드할 때 한 번 그린다. 정적 PNG 파일은 두지 않는다 |
| 이미지 내용 | 다람쥐, 서비스 이름 "탈탈", 한 줄 설명 |

## 이 스펙에서 정한 것

사용자 확인이 필요한 항목이다.

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| `metadataBase` | `SITE.url`이 있으면 `new URL(\`https://${SITE.url}\`)`, 없으면 두지 않는다 | `SITE.url`이 `null`일 수 있는 타입이다. 값이 없을 때 임의의 주소를 만들지 않는다 |
| 파일 | `app/opengraph-image.tsx` 하나. 루트 세그먼트에 두면 모든 화면에 적용된다 | 화면마다 다른 이미지가 필요하지 않다. 화면별 제목은 이미 `title`로 나뉘지만 공유 대상은 서비스 소개다 |
| 이미지 크기 | 1200×630 PNG | 메신저와 SNS가 큰 카드로 보여 주는 표준 크기다 |
| 구성 | 주황 바탕(`brand`)에 왼쪽에 서비스 이름과 한 줄 설명을, 오른쪽에 다람쥐(`mascot.default`)를 둔다. 아래 "이미지 구성"에 있다 | 소개와 시작 홈의 제목 영역과 같은 인상이다 |
| 글꼴 | 서비스 이름은 낭만있구미체, 설명은 SUIT 600이다. 서비스 이름은 낭만있구미체만 넣은 `ImageResponse`로 따로 PNG로 그려 `<img>`로 넣는다 | `docs/specs/recipe-image.md`에 적힌 대로 두 글꼴을 한 `ImageResponse`에 넣으면 SUIT 굵기가 틀어진다. 이 현상은 레시피 이미지에서 확인한 것이고 이 이미지에서는 다시 확인하지 않았다 |
| 이미지 대체 텍스트 | `서비스 이름: 한 줄 설명`(`SITE.name`과 `SITE.description`을 이은 것) | 화면 읽기와 `og:image:alt`에 쓴다. 새 문구를 더하지 않는다 |
| 트위터 카드 | `metadata.twitter = { card: 'summary_large_image' }`를 둔다. `twitter-image` 파일은 두지 않는다 | 빌드한 HTML에서 `twitter:image`가 `og:image`와 같은 주소로 나오는 것을 확인했다 |
| 설명 | 화면마다 따로 두지 않고 루트의 `SITE.description`을 쓴다 | 점검 수정 스펙과 같다 |

## 이미지 구성

값은 이미지(1200×630) 기준이다. 화면보다 훨씬 크게 그리므로 간격과 글자 크기는 `docs/design.md`의 값이 아니라 이 이미지에서 따로 정한다.

| 요소 | 값 |
| --- | --- |
| 바탕 | `brand` 주황. 색은 `loadImageColors()`가 전역 CSS의 토큰에서 읽는다 |
| 바깥 여백 | 좌우 72px, 위아래 72px |
| 서비스 이름 | 낭만있구미체. 높이 약 128px로 그린 PNG를 넣는다 |
| 한 줄 설명 | SUIT 600, 약 48px, `ink`. 두 줄이 되도록 폭을 정한다 |
| 다람쥐 | `public/images/mascot/default.png`를 data URL로 읽어 `<img>`로 넣는다. 가로 380px이고 오른쪽 아래에 가깝게 둔다 |
| 장식 | 두지 않는다. `docs/design.md`가 장식색과 도형으로 채우지 않는다고 정한다 |

구현할 때 값을 눈으로 보고 다듬는다. 위 값은 시작값이고, 다듬은 값은 `docs/design.md`에 옮긴다. 다람쥐가 설명과 겹치거나 서비스 이름이 잘리면 크기를 줄이고, 이유를 스펙에 적는다.

## 구현

| 파일 | 내용 |
| --- | --- |
| `app/opengraph-image.tsx` | 새 파일. 라우트 규칙에 맞게 `alt`, `size`, `contentType`을 내보내고 기본 내보내기로 이미지를 그리는 함수를 내보낸다. 그리는 코드는 `src/_app/og-image/`에 두고 이 파일은 다시 내보내기만 한다 |
| `src/_app/og-image/og-image.tsx` | 새 파일. 서버 전용. 레시피 이미지와 같은 방식으로 서비스 이름 PNG를 한 번 그리고, 이미지 전체를 `ImageResponse`로 그린다 |
| `src/_app/og-image/og-image.test.tsx` | 새 파일. 크기, 형식, 대체 텍스트를 확인한다 |
| `src/_app/layout/root-layout.tsx` | `metadataBase`와 `twitter.card`를 더한다 |
| `docs/requirements/foundation.md` | "앱 영역"에 공유 미리보기 항목을 더한다 |
| `docs/design.md` | "그림" 절에 공유 이미지 구성을 더한다 |

`export const size`, `contentType`, `alt`는 Next가 정적으로 읽을 수 있어야 하므로, `app/opengraph-image.tsx`를 다시 내보내기만으로 만들면 인식하지 못할 수 있다. 구현할 때 `npm run build`로 확인하고, 인식하지 못하면 이 세 값만 `app/opengraph-image.tsx`에 직접 쓴다. 값은 설정이고 로직이 아니라서 `app/`에 두어도 구조 규칙에 어긋나지 않는다.

`opengraph-image`는 `dynamic = 'force-static'`으로 빌드할 때 한 번 그린다. 미니앱 빌드(정적 export)에도 이 설정이 있어야 들어간다. 글꼴 데이터는 `ArrayBuffer`로 넘긴다. 빌드할 때만 그려지므로 `next.config.ts`의 `outputFileTracingIncludes`는 더하지 않는다.

`size`, `contentType`, `alt`는 `app/opengraph-image.tsx`에서 다시 내보내기만 해도 Next가 인식했다. 빌드한 HTML의 `og:image:width`, `og:image:height`, `og:image:alt`로 확인했다.

## 테스트

| 파일 | 확인하는 것 |
| --- | --- |
| `og-image.test.tsx` | 이미지가 PNG이고 IHDR의 가로 1200, 세로 630이다. `alt`가 `SITE.name`과 `SITE.description`을 포함한다. 서비스 이름의 글자가 낭만있구미체 지원 글자 목록에 있다 |
| `root-layout` 관련 | `metadataBase`가 `https://taltal.vercel.app`이고, `SITE.url`이 `null`이면 없다. `twitter.card`가 `summary_large_image`다 |

## 확인 방법

- `npm run build`가 끝나고 `/opengraph-image`가 정적으로 만들어진다.
- 빌드한 서버(`npm start`)에서 `/opengraph-image`가 PNG 1200×630으로 열리고 글자가 빠지지 않는다. 낭만있구미체 글자가 빈 칸이 아닌지 눈으로 본다.
- HTML `<head>`에 `og:image`(절대 주소), `og:image:width`, `og:image:height`, `og:image:alt`, `twitter:card`, `twitter:image`가 있다.
- 배포 뒤 사용자가 카카오톡과 Slack에 링크를 붙여 미리보기를 본다. 카카오톡은 처음 본 미리보기를 캐시하므로 링크를 공유하기 전에 확인한다. 이미지를 바꿔 다시 확인할 때는 카카오 공유 디버거로 캐시를 지운다.

그 뒤 `npm run lint`, `npm run typecheck`, `npm test`, `fsd-review` 스킬로 점검한다.

## 문서 반영

구현 전에 요구사항 문서를 먼저 고친다.

- `docs/requirements/foundation.md`: "앱 영역"의 공유 미리보기 항목을 "링크를 공유하면 서비스 이름, 한 줄 설명, 다람쥐가 있는 이미지가 보인다"로 고친다. 확인 기준에 "공유 미리보기 이미지가 1200×630 PNG로 열리고 낭만있구미체 글자에 빈 글자가 없다"를 더한다.
- `docs/design.md`: "그림" 절에 공유 이미지 구성과 값을 더한다.
