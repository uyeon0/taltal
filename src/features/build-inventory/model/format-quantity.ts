import type { InputUnit } from '@/entities/ingredient';

// 빠른 수량 버튼에 나오는 값과 흔히 넣는 값만 분수로 쓴다
const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/**
 * 화면에 보여 줄 숫자. 소수 둘째 자리까지 반올림하고, 그러면 0이 되는 작은 양수는 유효숫자 두 자리로 쓴다.
 * 0.0004포기를 "0포기"로 보여 주지 않기 위해서다.
 */
export function roundForDisplay(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return rounded === 0 && value > 0 ? Number(value.toPrecision(2)) : rounded;
}

/**
 * 사용자가 정한 수량을 화면 문자열로 바꾼다. 예: 0.5개 → "½개", 1500g → "1,500g", 1.25봉지 → "1.25봉지"
 * 사용자가 넣은 값을 그대로 보여 준다. g을 단위로 되돌려 표시하는 formatAmount와 다르다.
 */
export function formatQuantity(amount: number, unit: InputUnit): string {
  const fraction = FRACTIONS[amount];
  if (fraction) return `${fraction}${unit}`;
  return `${roundForDisplay(amount).toLocaleString('ko-KR', { maximumFractionDigits: 20 })}${unit}`;
}
