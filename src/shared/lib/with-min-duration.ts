import { LOADING_MIN_DURATION_MS } from '@/shared/config';

/**
 * 프로미스가 빨리 끝나도 최소 시간이 지난 뒤에 결과를 돌려준다. 실패도 같은 시간을 기다린다.
 * 화면 로딩 문구를 읽을 틈 없이 사라지지 않게 한다(docs/design.md "컴포넌트 상태").
 */
export async function withMinDuration<T>(promise: Promise<T>, ms: number = LOADING_MIN_DURATION_MS): Promise<T> {
  const wait = new Promise<void>((resolve) => setTimeout(resolve, ms));
  try {
    const result = await promise;
    await wait;
    return result;
  } catch (error) {
    await wait;
    throw error;
  }
}
