import type { Ingredient } from '@/entities/ingredient';

const withoutSpaces = (text: string) => text.replace(/\s+/g, '');

/** 재료 이름과 다른 이름에서 찾는다. "노랑파프리카"로 "노랑 파프리카"를 찾도록 공백을 빼고 비교한다 */
export function matchesQuery(ingredient: Ingredient, query: string): boolean {
  const q = withoutSpaces(query);
  if (q === '') return true;
  return [ingredient.id, ...ingredient.aliases].some((name) => withoutSpaces(name).includes(q));
}

export type MatchedSeasonings = {
  /** 있다고 보고 계산하는 양념의 id */
  basic: string[];
  /** 요리에 필요하면 "필요한 양념"으로 알리는 양념의 id */
  special: string[];
};

/** 별칭 앞에 붙은 "[불고기양념] 간장"의 요리 이름 부분 */
const RECIPE_TAG = /^\[[^\]]*\]\s*/;

/**
 * 검색어에 맞는 양념을 종류별로 찾는다. 별칭의 대괄호 앞부분은 요리 이름이라 빼고 찾는다.
 * 검색어가 비면 아무것도 맞지 않는다.
 */
export function findSeasonings(seasonings: Ingredient[], query: string): MatchedSeasonings {
  const matched: MatchedSeasonings = { basic: [], special: [] };
  const q = withoutSpaces(query);
  if (q === '') return matched;
  for (const seasoning of seasonings) {
    const names = [seasoning.id, ...seasoning.aliases.map((alias) => alias.replace(RECIPE_TAG, ''))];
    if (!names.some((name) => withoutSpaces(name).includes(q))) continue;
    if (seasoning.pantry === '기본') matched.basic.push(seasoning.id);
    else if (seasoning.pantry === '특수') matched.special.push(seasoning.id);
  }
  return matched;
}
