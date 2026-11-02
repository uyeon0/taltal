import type { Ingredient } from '@/entities/ingredient';

const withoutSpaces = (text: string) => text.replace(/\s+/g, '');

/** 재료 이름과 다른 이름에서 찾는다. "노랑파프리카"로 "노랑 파프리카"를 찾도록 공백을 빼고 비교한다 */
export function matchesQuery(ingredient: Ingredient, query: string): boolean {
  const q = withoutSpaces(query);
  if (q === '') return true;
  return [ingredient.id, ...ingredient.aliases].some((name) => withoutSpaces(name).includes(q));
}
