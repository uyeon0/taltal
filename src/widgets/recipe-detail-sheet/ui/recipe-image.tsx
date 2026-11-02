// 레시피 이미지(서버 ImageResponse)의 본체. 시트와 같은 RecipeDetailView를 받아 그린다.
// Satori는 Tailwind 클래스와 CSS 변수를 읽지 못하므로 인라인 style만 쓴다. 자식이 둘 이상인 div는 display: flex가 필요하다.
// 색은 서버가 전역 CSS의 토큰에서 읽어 colors로 넘긴다.
// 크기는 시트 값 × 2.2를 반올림한 값이다. 기준은 docs/specs/recipe-image.md의 "구성"이다.

import { copy } from '@/shared/copy';
import type { RecipeDetailView } from '../model/recipe-detail-view';

export const RECIPE_IMAGE_WIDTH = 1080;

/** 이미지에 쓰는 색. 값은 전역 CSS 토큰이다 */
export type RecipeImageColors = {
  /** 바탕. --primary */
  brand: string;
  /** 글자, 선, 순서 태그와 단계 번호의 면. --foreground */
  ink: string;
  /** 카드 면, 순서 태그와 단계 번호의 글자. --card */
  light: string;
  /** 재료 무리 사이 구분선. --border */
  subtle: string;
};

/** 시트의 선 3px */
const LINE = 7;
/** 서비스 이름 이미지의 높이 */
export const WORDMARK_HEIGHT = 44;

const FONT = {
  tag: 31,
  name: 53,
  meta: 31,
  body: 35,
  title: 44,
  tip: 31
} as const;

const SPACE = {
  /** 시트 gap-1 */
  xs: 9,
  /** 시트 gap-2 */
  sm: 18,
  /** 시트 gap-3 */
  md: 26,
  /** 시트 gap-4 */
  lg: 35,
  page: 56
} as const;

// SUIT에 없는 글자. 그대로 두면 ImageResponse가 Google Fonts에서 글꼴을 받아 오려 하고, 받지 못하면 빈 네모로 그린다.
// 이미지에서만 같은 값의 다른 표기로 바꾼다. 실제 데이터에서 찾은 글자다
const SUBSTITUTES: [RegExp, string][] = [
  [/⅓/g, '1/3'],
  [/⅔/g, '2/3'],
  [/㎝/g, 'cm'],
  [/∼/g, '~'],
  // 원본에서 깨진 한글 자리에 들어 있는 전각 물음표. 시트와 같은 모양의 반각으로 쓴다
  [/？/g, '?'],
  // 한자는 "나복저(蘿 菹)"처럼 한글 뒤 괄호에만 있다. 괄호째 뺀다
  [/\s*\([\s\u3400-\u9fff\uf900-\ufaff]+\)/g, '']
];

/** 이미지에 쓸 글. SUIT에 없는 글자를 바꾼다 */
export function toImageText(text: string): string {
  return SUBSTITUTES.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

/** 데이터에서 온 글을 모두 toImageText로 바꾼다 */
function toImageView(view: RecipeDetailView): RecipeDetailView {
  const amounts = <T extends { name: string; amount: string }>(items: T[]) =>
    items.map((item) => ({ ...item, name: toImageText(item.name), amount: toImageText(item.amount) }));
  return {
    ...view,
    name: toImageText(view.name),
    cookingTime: toImageText(view.cookingTime),
    summary: view.summary === null ? null : toImageText(view.summary),
    owned: amounts(view.owned),
    toBuy: amounts(view.toBuy),
    optional: view.optional.map(toImageText),
    seasonings: amounts(view.seasonings),
    steps:
      view.steps?.map((step) => ({
        ...step,
        text: toImageText(step.text),
        tip: step.tip === null ? null : toImageText(step.tip)
      })) ?? null
  };
}

export type Wordmark = { src: string; width: number; height: number };

type RecipeImageProps = {
  view: RecipeDetailView;
  /** 낭만있구미체로 따로 그린 서비스 이름 PNG(data URI)와 그 픽셀 크기 */
  wordmark: Wordmark;
  /** 서비스 주소. 없으면 이름만 쓴다 */
  url: string | null;
  colors: RecipeImageColors;
};

export function RecipeImage({ view: dataView, wordmark, url, colors: c }: RecipeImageProps) {
  const view = toImageView(dataView);
  const fullLine = { display: 'flex', height: LINE, backgroundColor: c.ink } as const;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: RECIPE_IMAGE_WIDTH,
        backgroundColor: c.brand,
        color: c.ink,
        fontFamily: 'SUIT',
        fontSize: FONT.body,
        fontWeight: 400,
        lineHeight: 1.5,
        wordBreak: 'keep-all'
      }}
    >
      <Head view={view} c={c} />
      <div style={fullLine} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACE.lg,
          padding: `48px ${SPACE.page}px`
        }}
      >
        <Card c={c}>
          <Title>{copy.recipeSheet.ingredientsTitle}</Title>
          <Ingredients view={view} c={c} />
        </Card>
        {view.steps !== null ? (
          <Card c={c}>
            <Title>{copy.recipeSheet.stepsTitle}</Title>
            <Steps steps={view.steps} c={c} />
          </Card>
        ) : null}
      </div>
      <div style={fullLine} />
      <Footer wordmark={wordmark} url={url} />
    </div>
  );
}

function Head({ view, c }: { view: RecipeDetailView; c: RecipeImageColors }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: `${SPACE.page}px ${SPACE.page}px 48px`
      }}
    >
      <div
        style={{
          display: 'flex',
          backgroundColor: c.ink,
          color: c.light,
          borderRadius: 9999,
          padding: `9px ${SPACE.md}px`,
          fontSize: FONT.tag,
          fontWeight: 700,
          lineHeight: 1.3
        }}
      >
        {copy.mealCard.order(view.day)}
      </div>
      <div style={{ display: 'flex', marginTop: SPACE.sm, fontSize: FONT.name, fontWeight: 600, lineHeight: 1.3 }}>
        {view.name}
      </div>
      <div style={{ display: 'flex', marginTop: SPACE.xs, fontSize: FONT.meta }}>
        {copy.mealCard.cookingTime(view.cookingTime)}
      </div>
      {view.summary !== null ? <div style={{ display: 'flex', marginTop: SPACE.md }}>{view.summary}</div> : null}
    </div>
  );
}

function Card({ children, c }: { children: React.ReactNode; c: RecipeImageColors }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACE.lg,
        backgroundColor: c.light,
        border: `${LINE}px solid ${c.ink}`,
        borderRadius: 44,
        padding: `42px 48px`
      }}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: string }) {
  return <div style={{ display: 'flex', fontSize: FONT.title, fontWeight: 600, lineHeight: 1.3 }}>{children}</div>;
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', fontWeight: 600 }}>{children}</div>;
}

function AmountRows({ items }: { items: { name: string; amount: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
      {items.map((item) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.md }}>
          <div style={{ display: 'flex', flex: 1 }}>{item.name}</div>
          <div style={{ display: 'flex', fontWeight: 500 }}>{item.amount}</div>
        </div>
      ))}
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>{children}</div>;
}

/** 시트와 같은 세 무리. 무리 사이에는 Subtle 선을 둔다 */
function Ingredients({ view, c }: { view: RecipeDetailView; c: RecipeImageColors }) {
  const groups: React.ReactNode[] = [];
  if (view.owned.length > 0) {
    groups.push(
      <Group key="owned">
        <Subtitle>{copy.recipeSheet.ownedTitle}</Subtitle>
        <AmountRows items={view.owned} />
      </Group>
    );
  }
  if (view.toBuy.length > 0 || view.optional.length > 0) {
    groups.push(
      <div
        key="toBuy"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACE.sm,
          border: `${LINE}px solid ${c.ink}`,
          borderRadius: 18,
          padding: `${SPACE.sm}px ${SPACE.md}px`
        }}
      >
        <Subtitle>{copy.recipeSheet.toBuyTitle}</Subtitle>
        <AmountRows
          items={[...view.toBuy, ...view.optional.map((name) => ({ name, amount: copy.recipeSheet.optional }))]}
        />
      </div>
    );
  }
  if (view.seasonings.length > 0) {
    groups.push(
      <Group key="seasonings">
        <Subtitle>
          {copy.recipeSheet.seasoningsTitle}
          <span style={{ marginLeft: 12, fontSize: FONT.tip, fontWeight: 500 }}>
            · {copy.recipeSheet.seasoningsBasis(view.servingsOriginal)}
          </span>
        </Subtitle>
        <AmountRows items={view.seasonings} />
      </Group>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
      {groups.flatMap((group, index) =>
        index === 0
          ? [group]
          : [<div key={`line-${index}`} style={{ display: 'flex', height: 3, backgroundColor: c.subtle }} />, group]
      )}
    </div>
  );
}

function Steps({ steps, c }: { steps: NonNullable<RecipeDetailView['steps']>; c: RecipeImageColors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
      {steps.map((step) => (
        <div key={step.no} style={{ display: 'flex', gap: SPACE.md }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              width: 62,
              height: 62,
              borderRadius: 9999,
              backgroundColor: c.ink,
              color: c.light,
              fontSize: FONT.tag,
              fontWeight: 600
            }}
          >
            {String(step.no)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: SPACE.xs, paddingTop: 4 }}>
            <div style={{ display: 'flex' }}>{step.text}</div>
            {step.tip ? (
              // Satori에는 인라인 문단이 없다. "팁"과 내용이 한 문단처럼 이어 접히도록 낱말을 따로 둔 flex-wrap으로 그린다
              <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 9, fontSize: FONT.tip }}>
                <span style={{ fontWeight: 600 }}>{copy.recipeSheet.tip}</span>
                {step.tip.split(/\s+/).map((word, index) => (
                  <span key={index}>{word}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function Footer({ wordmark, url }: { wordmark: Wordmark; url: string | null }) {
  const width = Math.round((wordmark.width * WORDMARK_HEIGHT) / wordmark.height);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm, padding: SPACE.page }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori는 next/image를 그리지 못한다 */}
        <img src={wordmark.src} width={width} height={WORDMARK_HEIGHT} alt="" />
        {url ? <div style={{ display: 'flex', fontSize: FONT.meta, fontWeight: 500 }}>{url}</div> : null}
      </div>
      <div style={{ display: 'flex', fontSize: FONT.meta }}>{copy.recipeSheet.recipeSource}</div>
    </div>
  );
}
