import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { copy } from '@/shared/copy';
import { AppHeader } from '@/shared/ui/app-header';
import { buttonVariants } from '@/shared/ui/button';
import { Mascot } from '@/shared/ui/mascot';
import { SampleMeals } from './sample-meals';
import { VisitGate } from './visit-gate';

// 재료 입력 화면이 재료 선택 시트를 여는 주소. 시트 이름은 build-inventory의 INGREDIENT_PICKER_SHEET와 같아야 한다
export const INGREDIENT_PICKER_HREF = '/ingredients?sheet=ingredient-picker';

// 시작 홈. 입력을 받지 않고 입력 상태도 읽지 않는다
export function HomePage() {
  const { home } = copy;

  return (
    // 화면 배경은 앱 열의 주황 면이다
    <VisitGate>
      <main>
        <AppHeader />

        {/* 소개 화면의 제목 영역과 같은 구조다. 소개의 설명 자리에 시작 안내를 둔다. 아래를 앱 폭 전체의 Ink 선으로 나눈다 */}
        <div className="flex flex-col gap-3 border-b border-foreground px-(--page-gutter) pt-4 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 flex-1 whitespace-pre-line font-display text-display-sm">{home.title}</h1>
            <div className="-ml-4 shrink-0">
              <Mascot pose="default" size={150} priority className="size-(--mascot-header-size)" />
            </div>
          </div>
          <p className="text-xl">{home.guide}</p>
        </div>

        <section className="flex flex-col gap-(--section-gap) px-(--page-gutter) py-8">
          <div className="flex flex-col gap-2">
            {/* Button asChild는 서버 컴포넌트에서 onClick을 Link에 넘기므로 클래스만 가져다 쓴다 */}
            <Link
              href={INGREDIENT_PICKER_HREF}
              className={buttonVariants({ size: 'primary', className: 'w-full justify-between' })}
            >
              {home.pickDirectly}
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </section>

        {/* 캐러셀이 화면 좌우 끝까지 쓰도록 버튼 구역 밖에 둔다. 버튼 구역의 아래 간격(32px)이 구역 사이 간격이다 */}
        <div className="pb-6">
          <SampleMeals />
        </div>
      </main>
    </VisitGate>
  );
}
