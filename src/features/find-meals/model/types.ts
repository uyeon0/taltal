// 추천 함수의 결과 형태. docs/data-contract.md와 같게 유지한다.

export type Meal = {
  recipeId: number;
  name: string;
  uses: { ingredientId: string; grams: number }[]; // 인분 수를 곱한 사용량
  toBuy: string[]; // uses 중 shoppingList에 있는 재료
  pantryNeeded: string[];
  day: number; // 요리 순서. 1부터 시작하고 요리마다 다르다. meals 배열 순서는 그대로다
  urgency: '빨리 상함' | '보통' | '오래 감' | null; // 이 요리가 쓰는 가진 재료 중 가장 빨리 상하는 등급. 가진 재료의 등급이 없으면 null
  urgentIngredients: string[]; // 그 등급인 가진 재료 id. 화면에서 "상추 먼저"처럼 이유를 보여 줄 때 쓴다
};

export type Leftover = { ingredientId: string; startGrams: number; leftGrams: number };

export type Result = {
  status: 'ok' | 'partial' | 'empty';
  meals: Meal[];
  // 조합 전체에서 모자라는 양. optional은 "약간"으로만 쓰는 재료라 없어도 되는 것
  shoppingList: { ingredientId: string; grams: number; optional: boolean }[];
  leftovers: Leftover[];
  leftoverRatio: number;
};
