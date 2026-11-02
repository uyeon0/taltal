// @vitest-environment jsdom
// 시작 버튼이 방문 쿠키를 쓴 뒤 replace로 시작 홈에 가는지 확인한다.

import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, test, vi } from 'vitest';

const calls: string[] = [];
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: (href: string) => calls.push(`replace ${href}`),
    push
  })
}));
vi.mock('@/shared/lib/visit', () => ({ markVisited: () => calls.push('markVisited') }));

import { StartButton } from './start-button';

afterEach(() => {
  cleanup();
  calls.length = 0;
  push.mockClear();
});

test('누르면 방문 쿠키를 먼저 쓰고 replace로 시작 홈에 간다', () => {
  render(<StartButton>시작</StartButton>);
  fireEvent.click(screen.getByRole('button', { name: '시작' }));

  assert.deepEqual(calls, ['markVisited', 'replace /']);
  assert.equal(push.mock.calls.length, 0);
});
