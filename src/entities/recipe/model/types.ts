// 레시피 데이터의 형태. docs/data-contract.md와 같게 유지한다.

export type RecipeIngredient = {
  ingredientId: string;
  grams: number | null; // 1인분 g. 양념이면 null
  vague: boolean; // 분량이 "약간", "조금", "적당량"뿐이면 true (고명)
  amountText: string;
  role: '주재료' | '부재료' | '양념';
};

export type Recipe = {
  id: number;
  name: string;
  type: string;
  cookingTime: string;
  level: string;
  servingsOriginal: number;
  ingredients: RecipeIngredient[];
};

export type RecipeDetail = {
  id: number;
  summary: string;
  steps: { no: number; text: string; tip: string | null }[];
};
