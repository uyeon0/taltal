import { copy } from '@/shared/copy';
import { Card } from '@/shared/ui/card';
import { Carousel } from '@/shared/ui/carousel';
import { Separator } from '@/shared/ui/separator';
import { SAMPLES, type Sample } from '../model/samples';

/**
 * 재료가 요리 몇 가지에 어떻게 나뉘는지 보여 주는 예시 묶음. 고정 값이고 추천을 실행하지 않는다.
 * 입력을 받지 않으므로 카드에 링크나 버튼을 두지 않는다
 */
export function SampleMeals() {
  const { home } = copy;

  return (
    <section aria-labelledby="sample-meals-title" className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-(--page-gutter)">
        <h2 id="sample-meals-title" className="font-display text-2xl">
          {home.sampleTitle}
        </h2>
      </div>

      {/* 카드를 화면 가운데에 두고, 양옆에 이웃 장의 끝이 보여서 넘길 수 있다는 것을 알린다 */}
      <Carousel
        label={home.sampleCarouselLabel}
        controls={false}
        align="center"
        slideClassName="basis-5/6"
        slides={SAMPLES.map((sample) => ({ key: sample.ingredients, content: <SampleCard sample={sample} /> }))}
      />
    </section>
  );
}

function SampleCard({ sample }: { sample: Sample }) {
  const { home, results, mealCard } = copy;

  return (
    <Card>
      {/* 재료 줄이 카드 제목이다. 요리명은 목록 항목이라 한 단계 작게 둔다 */}
      <div className="flex flex-col gap-1">
        <p className="font-heading text-xl font-bold">{sample.ingredients}</p>
        {/* 예시 묶음은 모두 가진 재료를 다 쓴다. 결과 화면의 같은 경우와 같은 문구다 */}
        <p className="font-semibold">{results.titleAllUsed}</p>
      </div>

      <Separator />

      <ol className="flex flex-col gap-(--list-gap)">
        {sample.meals.map((meal, index) => (
          <li key={meal.name} className="flex gap-2">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-foreground text-xs"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">
                <span className="sr-only">{mealCard.order(index + 1)} </span>
                {meal.name}
              </p>
              <p className="text-xs">{meal.uses}</p>
            </div>
          </li>
        ))}
      </ol>

      <Separator />
      <p>{home.toBuy(sample.toBuy)}</p>
    </Card>
  );
}
