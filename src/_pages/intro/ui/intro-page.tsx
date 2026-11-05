import { copy } from '@/shared/copy';
import { AppHeader } from '@/shared/ui/app-header';
import { Mascot } from '@/shared/ui/mascot';
import { IntroCarousel } from './intro-carousel';
import { StartButton } from './start-button';

// 첫 방문에만 나오는 화면. 헤더부터 화면 전체가 앱 열의 주황 면이다
export function IntroPage() {
  const { intro } = copy;

  // 높이는 주소창이 보일 때 기준(svh)으로 고정해 스크롤할 때 다시 계산하지 않는다.
  // 아래 고정 영역 높이(버튼, 위아래 여백 24px, 위 선)만큼 비워 내용이 가려지지 않게 한다
  return (
    <main className="flex min-h-svh flex-col pb-(--intro-start-bar-height)">
      <AppHeader />

      {/* 제목 영역 아래를 앱 폭 전체의 Ink 선으로 나눈다. 시작 홈의 제목 영역과 같다 */}
      <div className="flex flex-col gap-2 border-b border-foreground px-(--page-gutter) py-3 tall:gap-3 tall:py-4">
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 flex-1 whitespace-pre-line font-display text-display-sm">{intro.title}</h1>
          <div className="-ml-4 shrink-0">
            <Mascot pose="default" size={150} priority className="size-20 tall:size-(--mascot-header-size)" />
          </div>
        </div>
        <p className="tall:text-xl">{intro.description}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <IntroCarousel />
      </div>

      {/* 재료 입력의 아래 고정 영역처럼 화면 바닥에 붙이고, 위쪽 Ink 선으로 스크롤되는 내용과 층을 나눈다 */}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-(--app-max-width) border-t border-foreground bg-background px-(--page-gutter) py-3">
        <StartButton>{intro.start}</StartButton>
      </div>
    </main>
  );
}
