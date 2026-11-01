// 재료 데이터의 형태. docs/data-contract.md와 같게 유지한다.

/** 화면 입력 단위. 실제 데이터에 새 단위가 생기면 여기에 더한다(테스트가 알려 준다) */
export const INPUT_UNITS = [
  'g',
  '개',
  '봉지',
  '장',
  '단',
  '마리',
  '포기',
  '팩',
  '대',
  '줄',
  '모',
  '공기',
  '뿌리',
  '통'
] as const;
export type InputUnit = (typeof INPUT_UNITS)[number];

export type Ingredient = {
  id: string;
  aliases: string[];
  pantry: '기본' | '특수' | null;
  unitGrams: Partial<Record<InputUnit, number>>; // 입력 단위 → g. 양념은 빈 객체
  inputUnits: InputUnit[]; // 화면 입력 단위. 첫 값이 기본, 마지막은 늘 "g". 양념은 빈 배열
  gramsSource: 'AI 추정' | '마트 라벨' | null;
  perishability?: '빨리 상함' | '보통' | '오래 감' | null; // 보관 기간 세 단계. 양념은 null, 없으면 가중치 1
};

/** 가진 재료 하나와 그 양(g). 추천 함수의 입력이다 */
export type Stock = { ingredientId: string; grams: number };
