import { copy } from '@/shared/copy';

/** 재료명 문구에 쓰는 재료 수. 담은 순서로 앞에서부터 쓴다 */
const MAX_INGREDIENT_PHRASES = 3;

/** 계산 중 문구. 고정 문구로 시작해 재료명 문구와 번갈아 둔다 */
export function loadingPhrases(ingredientIds: string[]): string[] {
  const fixed = copy.loading.phrases;
  const named = ingredientIds.slice(0, MAX_INGREDIENT_PHRASES).map(copy.loading.ingredientPhrase);
  const phrases: string[] = [];
  for (let i = 0; i < Math.max(fixed.length, named.length); i++) {
    if (i < fixed.length) phrases.push(fixed[i]);
    if (i < named.length) phrases.push(named[i]);
  }
  return phrases;
}
