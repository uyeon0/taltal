import { Suspense } from 'react';
import { getIngredients } from '@/entities/ingredient/index.server';
import { ResultsScreen } from './results-screen';

/**
 * 추천 결과. 양념까지 모든 재료를 서버에서 읽어 넘긴다. recommend가 보관 등급과 특수 양념을 보기 때문이다.
 * 읽기 함수가 캐시되므로 빌드할 때 정적으로 만들어진다.
 */
export async function ResultsPage() {
  const ingredients = await getIngredients();

  // 시트 상태를 주소 쿼리에서 읽으므로 Suspense로 감싼다
  return (
    <Suspense>
      <ResultsScreen ingredients={ingredients} />
    </Suspense>
  );
}
