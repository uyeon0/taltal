# 와이어프레임

화면 배치를 참고하는 시안이다. 구현 기준은 `docs/requirements/`, `docs/design.md`, `docs/copy.md`이고, 시안과 문서가 다르면 문서를 따른다.

각 파일은 설치나 서버 없이 브라우저로 바로 열린다. 새로고침하면 처음 상태로 돌아간다.

| 파일 | 참고할 내용 | 관련 요구사항 |
| --- | --- | --- |
| `home-first-visit.html` | 첫 방문 소개의 배치 | `onboarding.md` |
| `home-returning.html` | 시작 홈의 배치 | `onboarding.md` |
| `ingredient-input-wireframe.html` | 재료 선택, 수량 편집, 직접 입력, 기본 양념, 인분 | `ingredient-input.md` |
| `recipe-results-wireframe.html` | 결과 구성, 요약, 요리 카드, 사용량 시트, 레시피 상세 | `results.md`, `recipe-detail.md` |
| `integrated-flow-wireframe.html` | 입력, 계산 중, 결과, 오류, 추천 없음 사이의 상태 전달 | `overview.md`, `results.md` |
| `ingredient-input-style-study.html` | 색, 서체, 다람쥐를 입힌 시작 화면과 입력 화면의 인상 | `design.md` |
| `design-refresh-study.html` | 색 면, 모양, 글자, 그림을 비교한 디자인 보완 시안 | `design.md` |

## 기준으로 쓰지 않는 것

- 문구, 요리 이름, 수량, 단위 환산값은 예시다.
- 흑백 시안의 색, 글자 크기, 간격, 라운딩은 디자인 값이 아니다.
- 상단의 테스트 선택기와 하단의 가상 데이터 설명은 검토용이다.
- 통합 시안의 배분 계산은 가상이다. 추천 로직으로 옮기지 않는다.
- 사진이나 영수증으로 재료를 넣는 체험 기능은 범위 밖이다. 구현하지 않는다.
- 폰트는 시안에서만 CDN으로 불러온다. 앱은 셀프 호스팅한다.
