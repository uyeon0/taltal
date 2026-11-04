import { copy } from '@/shared/copy';
import { AppHeader } from '@/shared/ui/app-header';
import { Mascot } from '@/shared/ui/mascot';
import { IntroCarousel } from './intro-carousel';
import { StartButton } from './start-button';

// 첫 방문에만 나오는 화면. 헤더부터 화면 전체가 앱 열의 주황 면이다
export function IntroPage() {
  const { intro } = copy;

  return (
    <main className="flex min-h-svh flex-col">
      <AppHeader />

      {/* 제목 영역 아래를 앱 폭 전체의 Ink 선으로 나눈다. 시작 홈의 제목 영역과 같다 */}
      <div className="flex flex-col gap-3 border-b border-foreground px-(--page-gutter) pt-4 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 flex-1 whitespace-pre-line font-display text-display-sm">{intro.title}</h1>
          <div className="-ml-4 shrink-0">
            <Mascot pose="default" size={150} priority className="size-(--mascot-header-size)" />
          </div>
        </div>
        <p className="text-xl">{intro.description}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <IntroCarousel />
      </div>

      {/* 재료 입력의 아래 고정 영역처럼 위쪽 Ink 선으로 스크롤되는 내용과 층을 나눈다 */}
      <div className="sticky bottom-0 mt-auto border-t border-foreground bg-background px-(--page-gutter) py-3">
        <StartButton>{intro.start}</StartButton>
      </div>
    </main>
  );
}
