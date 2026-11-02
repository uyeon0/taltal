// 시작 홈의 예시 요리 묶음. 시작 홈에서만 쓰는 고정 값이고, 화면 문구 기준은 docs/copy.md의 "예시 묶음"이다.
// 가진 재료를 모두 다 쓰는 묶음만 둔다. 각 요리 2인분으로 실제 데이터에서 추천 함수를 돌린 결과를 옮겼다.

export type SampleMeal = {
  name: string;
  uses: string; // 이 요리에 쓰는 가진 재료와 양. formatAmount로 쓴 값을 " · "로 이었다
};

export type Sample = {
  ingredients: string; // 가진 재료와 양
  meals: SampleMeal[]; // 요리 순서대로
  toBuy: string; // 따로 사는 재료. 있으면 좋은 재료는 넣지 않는다
};

export const SAMPLES: Sample[] = [
  {
    ingredients: '오징어 2마리 · 오이 2개',
    meals: [
      { name: '오징어숙회', uses: '오징어 1마리' },
      { name: '오징어도라지생채', uses: '오징어 1마리 · 오이 1개' },
      { name: '오이나물', uses: '오이 1개' }
    ],
    toBuy: '대파, 도라지'
  },
  {
    ingredients: '돼지고기 500g · 계란 3개',
    meals: [
      { name: '제육불고기', uses: '돼지고기 300g' },
      { name: '삼겹살깻잎전', uses: '돼지고기 200g · 계란 1개' },
      { name: '계란말이', uses: '계란 2개' }
    ],
    toBuy: '대파, 깻잎'
  },
  {
    ingredients: '닭고기 2마리 · 계란 3개',
    meals: [
      { name: '닭강정', uses: '닭고기 1마리' },
      { name: '닭꼬치구이', uses: '닭고기 1마리 · 계란 1개' },
      { name: '계란말이', uses: '계란 2개' }
    ],
    toBuy: '대파, 홍고추'
  }
];
