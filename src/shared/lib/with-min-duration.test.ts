// 응답이 빨라도 최소 시간 동안 기다리는지 확인한다.

import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

import { withMinDuration } from './with-min-duration';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('빨리 끝나도 최소 시간이 지난 뒤에 결과를 돌려준다', async () => {
  let result: string | undefined;
  withMinDuration(Promise.resolve('완료'), 2400).then((value) => (result = value));

  await vi.advanceTimersByTimeAsync(2399);
  assert.equal(result, undefined);
  await vi.advanceTimersByTimeAsync(1);
  assert.equal(result, '완료');
});

test('최소 시간보다 오래 걸리면 끝나는 대로 돌려준다', async () => {
  let result: string | undefined;
  const slow = new Promise<string>((resolve) => setTimeout(() => resolve('완료'), 3000));
  withMinDuration(slow, 2400).then((value) => (result = value));

  await vi.advanceTimersByTimeAsync(3000);
  assert.equal(result, '완료');
});

test('실패도 최소 시간을 기다린 뒤에 던진다', async () => {
  const caught: { error?: unknown } = {};
  withMinDuration(Promise.reject(new Error('실패')), 2400).catch((reason) => (caught.error = reason));

  await vi.advanceTimersByTimeAsync(2399);
  // assert.equal(caught.error, undefined)는 caught.error의 타입을 undefined로 좁혀서 아래 검사가 타입 오류가 난다
  assert.equal('error' in caught, false);
  await vi.advanceTimersByTimeAsync(1);
  assert.ok(caught.error instanceof Error);
});
