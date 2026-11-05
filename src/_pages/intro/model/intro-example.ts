/**
 * 소개 3장 막대의 g 값. 화면 글자는 copy.intro의 예시 문구가 맡고, 이 값은 막대 조각 폭에만 쓴다.
 * 요리 순서는 copy.intro.exampleMeals와 같다
 */
export const INTRO_EXAMPLE_GRAMS = {
  start: 300,
  meals: [150, 100, 30],
  left: 20
} as const;

/** 3장의 두부 밖 막대. 요리 순서별 쓰는 비율(0~1). copy.intro.exampleMoreUsage와 순서가 같다 */
export const INTRO_EXAMPLE_MORE_RATIOS = [
  [0.5, 0.25, 0],
  [0, 0, 0.4],
  [0, 0.5, 0]
] as const;
