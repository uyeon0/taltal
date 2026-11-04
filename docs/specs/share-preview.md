# 공유 미리보기

링크를 메신저나 SNS에 붙였을 때 보이는 미리보기에 OG 이미지(1200×630)를 두고, 이미지 주소를 절대 주소로 만드는 `metadataBase`를 정한다.

- 기준 문서: `docs/requirements/foundation.md`의 "앱 영역", `docs/design.md`의 "공유 이미지"
- 확인하지 못한 것: 카카오톡과 Slack에서 보이는 모습. 배포 뒤 사용자가 휴대폰에서 확인한다

## 결정

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 이미지 | 확정 그림을 정적 PNG로 둔다. `app/opengraph-image.png`(1200×630) | 그림을 앱 밖에서 확정해 받는다(`docs/specs/brand-images.md`) |
| 대체 텍스트 | `app/opengraph-image.alt.txt`. `서비스 이름: 한 줄 설명` | 화면 읽기와 `og:image:alt`에 쓴다. 새 문구를 더하지 않는다 |
| 파일 위치 | 루트 세그먼트(`app/`)에 둔다 | 모든 화면에 적용된다. 화면마다 다른 이미지가 필요하지 않다 |
| `metadataBase` | `SITE.url`이 있으면 `new URL(\`https://${SITE.url}\`)`, 없으면 두지 않는다 | 값이 없을 때 임의의 주소를 만들지 않는다 |
| 트위터 카드 | `metadata.twitter = { card: 'summary_large_image' }`. `twitter-image` 파일은 두지 않는다 | `twitter:image`가 `og:image`와 같은 주소로 나온다 |
| 설명 | 화면마다 따로 두지 않고 루트의 `SITE.description`을 쓴다 | |

이미지 파일은 `scripts/build-image-assets.mjs`가 이미지 입력 폴더의 `brand/opengraph-image.png`를 복사해 넣는다. 크기가 1200×630이 아니면 스크립트가 멈춘다.

정적 파일이라 미리 그릴 필요가 없고, 웹 빌드와 미니앱 빌드(정적 export)에 그대로 들어간다.

## 테스트

| 파일 | 확인하는 것 |
| --- | --- |
| `root-layout` 관련 | `metadataBase`가 `https://taltal.vercel.app`이고, `SITE.url`이 `null`이면 없다. `twitter.card`가 `summary_large_image`다 |

## 확인 방법

- `npm run build` 뒤 `/opengraph-image.png`가 PNG 1200×630으로 열린다.
- HTML `<head>`에 `og:image`(절대 주소), `og:image:width`, `og:image:height`, `og:image:alt`, `twitter:card`, `twitter:image`가 있다.
- 배포 뒤 사용자가 카카오톡과 Slack에 링크를 붙여 미리보기를 본다. 카카오톡은 처음 본 미리보기를 캐시하므로, 이미지를 바꿔 다시 확인할 때는 카카오 공유 디버거로 캐시를 지운다.
