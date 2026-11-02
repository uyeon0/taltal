import { Suspense } from 'react';
import { FoundationPreview } from './foundation-preview';

// 시작 홈은 다음 단계에서 만든다. 지금은 공통 컴포넌트 확인 화면을 보여 준다
export function HomePage() {
  // 시트 상태를 주소 쿼리에서 읽으므로 Suspense로 감싼다
  return (
    <Suspense>
      <FoundationPreview />
    </Suspense>
  );
}
