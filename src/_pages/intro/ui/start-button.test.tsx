// @vitest-environment jsdom
// 시작 버튼이 방문을 기록한 뒤 replace로 시작 홈에 가는지 확인한다.

import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, test, vi } from 'vitest';

const calls: string[] = [];
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: (href: string) => calls.push(`replace ${href}`),
    push
  })
}));
const markVisited = vi.fn(async () => {
  calls.push('markVisited');
});
vi.mock('@/shared/lib/visit', () => ({ markVisited: () => markVisited() }));

import { StartButton } from './start-button';

afterEach(() => {
  cleanup();
  calls.length = 0;
  push.mockClear();
});

test('누르면 방문을 먼저 기록하고 replace로 시작 홈에 간다', async () => {
  render(<StartButton>시작</StartButton>);
  fireEvent.click(screen.getByRole('button', { name: '시작' }));

  await waitFor(() => assert.deepEqual(calls, ['markVisited', 'replace /']));
  assert.equal(push.mock.calls.length, 0);
});

test('방문 기록이 끝나기 전에는 시작 홈으로 가지 않고, 기록에 실패해도 시작 홈으로 간다', async () => {
  let fail: (error: Error) => void = () => {};
  markVisited.mockImplementationOnce(
    () =>
      new Promise<void>((_, reject) => {
        fail = reject;
      })
  );
  render(<StartButton>시작</StartButton>);
  fireEvent.click(screen.getByRole('button', { name: '시작' }));
  assert.deepEqual(calls, []);

  fail(new Error('Storage'));
  await waitFor(() => assert.deepEqual(calls, ['replace /']));
});
