/** 소수 한 자리로 반올림한다. 앱 데이터의 g과 화면 표시가 같은 규칙을 쓴다 */
export const round1 = (n: number) => Math.round(n * 10) / 10;
