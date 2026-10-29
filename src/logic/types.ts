// 앱 데이터와 추천 함수의 형태. app-data-schema.md와 같게 유지한다.

export type Ingredient = {
  id: string;
  aliases: string[];
  pantry: "기본" | "특수" | null;
  unitGrams: Record<string, number>;
  inputUnits: string[]; // 화면 입력 단위. 첫 값이 기본, 마지막은 늘 "g". 양념은 빈 배열
  gramsSource: "AI 추정" | "마트 라벨" | null;
  perishability?: "빨리 상함" | "보통" | "오래 감" | null; // 보관 기간 세 단계. 양념은 null, 없으면 가중치 1
};

export type RecipeIngredient = {
  ingredientId: string;
  grams: number | null; // 1인분 g. 양념이면 null
  vague: boolean; // 분량이 "약간", "조금", "적당량"뿐이면 true (고명)
  amountText: string;
  role: "주재료" | "부재료" | "양념";
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

export type Stock = { ingredientId: string; grams: number };

export type Meal = {
  recipeId: number;
  name: string;
  uses: { ingredientId: string; grams: number }[]; // 인분 수를 곱한 사용량
  toBuy: string[]; // uses 중 shoppingList에 있는 재료
  pantryNeeded: string[];
};

export type Leftover = { ingredientId: string; startGrams: number; leftGrams: number };

export type Result = {
  status: "ok" | "partial" | "empty";
  meals: Meal[];
  // 조합 전체에서 모자라는 양. optional은 "약간"으로만 쓰는 재료라 없어도 되는 것
  shoppingList: { ingredientId: string; grams: number; optional: boolean }[];
  leftovers: Leftover[];
  leftoverRatio: number;
};
