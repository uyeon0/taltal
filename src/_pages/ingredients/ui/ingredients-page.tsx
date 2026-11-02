import { Suspense } from 'react';
import { getPickableIngredients } from '@/features/build-inventory/index.server';
import { IngredientInputScreen } from './ingredient-input-screen';

/** 재료 입력. 재료 목록을 서버에서 읽어 넘긴다. 읽기 함수가 캐시되므로 빌드할 때 정적으로 만들어진다 */
export async function IngredientsPage() {
  const { pickable, pantryBasics } = await getPickableIngredients();

  // 시트 상태를 주소 쿼리에서 읽으므로 Suspense로 감싼다
  return (
    <Suspense>
      <IngredientInputScreen pickable={pickable} pantryBasics={pantryBasics} />
    </Suspense>
  );
}
