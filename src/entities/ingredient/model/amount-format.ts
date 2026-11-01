// 재료 양 표시 규칙 (PROJ1-123). 요약·배분 상세·요리 카드·장보기에서 같은 함수를 쓴다.
// 규칙의 원본은 기록 저장소 DESIGN.md "재료 배분 표현"과 DESIGN-HANDOFF.md다.
//
// - 분수(½ ⅓ ⅔ ¼ ¾)는 환산 오차 안에서 정확히 맞을 때만 쓴다. 예: 50g, 개 200g → ¼개
// - 분수가 아니어도 소수 한 자리로 정확히 맞으면 그대로(0.2개), 아니면 "약 0.4개"
// - 0이 아닌 양이 0.1 단위 아래면 "0.1개 미만(10g)". "0개"는 실제 0일 때만 쓴다
// - 이 함수는 표시 문자열만 만든다. 막대 비율·다 썼는지 판정은 g 내부값으로 한다

import type { Ingredient } from './types';

/** 양이 0이라고 볼 g 아래 값. 0이 아닌 값은 아무리 작아도 양수로 다룬다 */
const ZERO_G = 1e-6;
/** 환산 오차 허용 범위(g). 앱 데이터의 g은 0.1g 단위로 반올림돼 오므로 한 단계(0.1g)까지 같은 값으로 본다 */
export const TOLERANCE_G = 0.1;
/** 표시 단위로 이 값보다 적으면 "미만"으로 쓴다 */
export const TINY_UNIT = 0.1;

const FRACTIONS: [number, string][] = [
  [0, ''],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [1, '']
];

export type AmountKind = 'zero' | 'tiny' | 'exact' | 'approx';

export type AmountView = {
  text: string;
  /** zero: 실제 0 · tiny: 0.1 단위 미만의 양수 · exact: 정확한 값 · approx: 근삿값 */
  kind: AmountKind;
  /** 표시한 숫자(단위 기준). tiny는 합칠 수 없어 null */
  value: number | null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;
/** 1 → "1", 1.5 → "1.5" */
const trim = (n: number) => String(round1(n));

const gramsText = (grams: number) => (round1(grams) < TINY_UNIT ? '0.1g 미만' : `${trim(grams)}g`);

/** g 값을 입력 단위로 바꿔 표시 문구와 종류를 돌려준다 */
export function describeAmount(ingredient: Ingredient, grams: number, unit: string): AmountView {
  const per = unit === 'g' ? 1 : (ingredient.unitGrams[unit] ?? 0);
  // 환산 근거가 없는 단위는 g으로 보여 준다
  const label = per > 0 ? unit : 'g';
  const perG = per > 0 ? per : 1;

  if (!(grams > ZERO_G)) return { text: `0${label}`, kind: 'zero', value: 0 };

  if (label === 'g') {
    if (grams < TINY_UNIT) return { text: '0.1g 미만', kind: 'tiny', value: null };
    return { text: `${trim(grams)}g`, kind: 'exact', value: round1(grams) };
  }

  const q = grams / perG;
  if (q < TINY_UNIT) return { text: `0.1${label} 미만(${gramsText(grams)})`, kind: 'tiny', value: null };

  const whole = Math.floor(q);
  let best: { value: number; text: string; gap: number } | null = null;
  for (const [frac, glyph] of FRACTIONS) {
    const value = whole + frac;
    if (value === 0) continue;
    const gap = Math.abs(q - value) * perG;
    if (gap > TOLERANCE_G || (best && gap >= best.gap)) continue;
    const int = frac === 1 ? whole + 1 : whole;
    best = { value, gap, text: glyph ? `${int > 0 ? int : ''}${glyph}` : String(int) };
  }
  if (best) return { text: `${best.text}${label}`, kind: 'exact', value: best.value };

  const tenth = round1(q);
  if (Math.abs(q - tenth) * perG <= TOLERANCE_G) return { text: `${trim(tenth)}${label}`, kind: 'exact', value: tenth };
  return { text: `약 ${trim(tenth)}${label}`, kind: 'approx', value: tenth };
}

/**
 * 화면에 쓰는 양 문자열. 예: 200g, 개 → "¼개", 0.37개 → "약 0.4개", 10g → "0.1개 미만(10g)"
 * withGrams를 켜면 개·장 같은 단위 뒤에 g 환산값을 병기한다. 환산 근거(unitGrams)가 있는 단위에만 붙는다.
 */
export function formatAmount(
  ingredient: Ingredient,
  grams: number,
  unit: string,
  options: { withGrams?: boolean } = {}
): string {
  const view = describeAmount(ingredient, grams, unit);
  const converted = unit !== 'g' && (ingredient.unitGrams[unit] ?? 0) > 0;
  if (!options.withGrams || !converted || view.kind === 'zero' || view.kind === 'tiny') return view.text;
  return `${view.text} (${gramsText(grams)})`;
}

/**
 * 표시한 부분 양의 합이 표시한 전체 양과 같은지. 근삿값이 섞이면 어긋날 수 있다.
 * 0.1 단위 미만 값이 있으면 숫자로 더할 수 없어 false다. false일 때 화면은 "표시는 반올림 값이라 합이 다를 수 있어요" 같은 안내를 붙일 수 있다.
 * 내부 g 값은 항상 합이 맞는다. 막대 비율은 이 함수가 아니라 g으로 구한다.
 */
export function amountsReconcile(
  ingredient: Ingredient,
  unit: string,
  partsGrams: number[],
  totalGrams: number
): boolean {
  const total = describeAmount(ingredient, totalGrams, unit).value;
  if (total === null) return false;
  let sum = 0;
  for (const g of partsGrams) {
    const v = describeAmount(ingredient, g, unit).value;
    if (v === null) return false;
    sum += v;
  }
  return Math.abs(sum - total) < 1e-6;
}
