import { copy } from '@/shared/copy';
import { AppHeader } from '@/shared/ui/app-header';
import { Mascot } from '@/shared/ui/mascot';
import { IntroCarousel } from './intro-carousel';
import { StartButton } from './start-button';

// 첫 방문에만 나오는 화면. 머리글부터 화면 전체가 앱 열의 주황 면이다
export function IntroPage() {
  const { intro } = copy;

  return (
    <main className="flex min-h-svh flex-col">
      <AppHeader />

      <div className="flex flex-col gap-1 px-(--page-gutter) pt-4 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-4">
            <h1 className="min-w-0 flex-1 whitespace-pre-line font-display text-display-sm">{intro.title}</h1>
            <p className="text-xl">{intro.description}</p>
          </div>
          <div className="relative -ml-4 shrink-0">
            <Mascot pose="default" size={150} priority className="mr-4" />
            <Mascot pose="question" size={48} className="absolute top-0 right-0" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <IntroCarousel />
      </div>

      <div className="sticky bottom-0 mt-auto bg-background px-(--page-gutter) py-3">
        <StartButton>{intro.start}</StartButton>
      </div>
    </main>
  );
}
