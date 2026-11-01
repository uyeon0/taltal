// 재료 데이터의 형태. docs/data-contract.md와 같게 유지한다.

export type Ingredient = {
  id: string;
  aliases: string[];
  pantry: '기본' | '특수' | null;
  unitGrams: Record<string, number>;
  inputUnits: string[]; // 화면 입력 단위. 첫 값이 기본, 마지막은 늘 "g". 양념은 빈 배열
  gramsSource: 'AI 추정' | '마트 라벨' | null;
  perishability?: '빨리 상함' | '보통' | '오래 감' | null; // 보관 기간 세 단계. 양념은 null, 없으면 가중치 1
};

/** 가진 재료 하나와 그 양(g). 추천 함수의 입력이다 */
export type Stock = { ingredientId: string; grams: number };
