import { gramsPerUnit, toGrams, type Ingredient, type InputUnit } from '@/entities/ingredient';
import { roundForDisplay } from './format-quantity';

/** 직접 입력의 최댓값(입력 단위 기준) */
export const MAX_AMOUNT = 100_000;
/** g으로 바꾼 최댓값. 서버 API가 재료 하나에 이만큼까지만 받는다(docs/data-contract.md "서버 API") */
export const MAX_GRAMS = 10_000_000;

/** 0 초과, MAX_AMOUNT 이하이고 g으로 바꿔도 MAX_GRAMS 이하인지 */
export function isValidAmount(value: number, ingredient: Ingredient, unit: InputUnit): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT && toGrams(ingredient, value, unit) <= MAX_GRAMS;
}

/** 입력칸 글자를 수량으로 바꾼다. 숫자가 아니거나 허용 범위를 벗어나면 null이다 */
export function parseAmount(text: string, ingredient: Ingredient, unit: InputUnit): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return isValidAmount(value, ingredient, unit) ? value : null;
}

/**
 * 직접 입력 상태. grams는 사용자가 마지막으로 넣은 수량을 g으로 바꾼 값이다.
 * 단위를 바꾸면 grams로 숫자를 다시 구하므로, 단위를 오가도 처음 양으로 돌아온다.
 */
export type AmountDraft = {
  text: string;
  unit: InputUnit;
  grams: number | null;
  /** 단위를 바꿀 때 넣은 글자. 사용자가 고치지 않았으면 저장할 때 반올림 전 값을 쓴다 */
  convertedText: string | null;
};

function gramsOf(text: string, ingredient: Ingredient, unit: InputUnit): number | null {
  const trimmed = text.trim();
  const value = Number(trimmed);
  return trimmed !== '' && Number.isFinite(value) ? toGrams(ingredient, value, unit) : null;
}

export function createDraft(ingredient: Ingredient, amount: number | null, unit: InputUnit): AmountDraft {
  const text = amount === null ? '' : String(roundForDisplay(amount));
  // 저장된 값이 반올림돼 보이면 저장할 때 원래 값을 쓰도록 환산한 글자로 둔다
  const grams = amount === null ? null : toGrams(ingredient, amount, unit);
  return { text, unit, grams, convertedText: amount !== null && String(amount) !== text ? text : null };
}

export function editDraftText(draft: AmountDraft, ingredient: Ingredient, text: string): AmountDraft {
  return { ...draft, text, grams: gramsOf(text, ingredient, draft.unit), convertedText: null };
}

export function changeDraftUnit(draft: AmountDraft, ingredient: Ingredient, unit: InputUnit): AmountDraft {
  const per = gramsPerUnit(ingredient, unit);
  if (draft.grams === null || per <= 0) return { ...draft, unit, convertedText: null };
  const text = String(roundForDisplay(draft.grams / per));
  return { ...draft, unit, text, convertedText: text };
}

/** 저장할 수량. 숫자가 아니거나 범위를 벗어나면 null이다 */
export function draftAmount(draft: AmountDraft, ingredient: Ingredient): number | null {
  const per = gramsPerUnit(ingredient, draft.unit);
  if (draft.convertedText !== null && draft.text === draft.convertedText && draft.grams !== null && per > 0) {
    const exact = draft.grams / per;
    return isValidAmount(exact, ingredient, draft.unit) ? exact : null;
  }
  return parseAmount(draft.text, ingredient, draft.unit);
}
