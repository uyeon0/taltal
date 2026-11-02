// @vitest-environment jsdom
// 앱 안 화면 기록의 깊이를 세는지 확인한다. 개발 모드의 Strict Mode에서 효과가 두 번 돌아도 첫 화면은 세지 않아야 한다.

import assert from 'node:assert/strict';
import { act, cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, test, vi } from 'vitest';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

// 깊이는 모듈 상태라 테스트마다 모듈을 새로 불러온다
let history: typeof import('./app-history');

function Tracker() {
  history.useAppHistoryTracker();
  return null;
}

beforeEach(async () => {
  vi.resetModules();
  history = await import('./app-history');
  pathname = '/';
});

afterEach(cleanup);

test('주소로 바로 들어온 첫 화면은 Strict Mode에서도 앱 안 기록이 아니다', () => {
  render(
    <StrictMode>
      <Tracker />
    </StrictMode>
  );
  assert.equal(history.canGoBackInApp(), false);
});

test('다른 화면으로 가면 늘고, 뒤로가기로 돌아오면 준다', () => {
  const view = render(
    <StrictMode>
      <Tracker />
    </StrictMode>
  );

  pathname = '/ingredients';
  view.rerender(
    <StrictMode>
      <Tracker />
    </StrictMode>
  );
  assert.equal(history.canGoBackInApp(), true);

  // 브라우저 뒤로가기: popstate가 먼저 오고 경로가 바뀐다
  window.history.replaceState(null, '', '/');
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  pathname = '/';
  view.rerender(
    <StrictMode>
      <Tracker />
    </StrictMode>
  );
  assert.equal(history.canGoBackInApp(), false);
});
