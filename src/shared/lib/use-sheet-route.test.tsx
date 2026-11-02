// @vitest-environment jsdom
// 시트를 주소 쿼리로 열고 닫는지, 닫은 뒤 포커스가 돌아가는지 확인한다.

import assert from 'node:assert/strict';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { afterEach, beforeEach, test, vi } from 'vitest';

import { useSheetRoute } from './use-sheet-route';

// Next.js는 history.pushState와 뒤로가기를 useSearchParams에 반영한다. 테스트에서는 같은 동작을 흉내 낸다
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
vi.mock('next/navigation', () => ({
  useSearchParams: () =>
    new URLSearchParams(
      useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => window.location.search
      )
    )
}));

const originalPushState = window.history.pushState.bind(window.history);
const originalReplaceState = window.history.replaceState.bind(window.history);

beforeEach(() => {
  originalReplaceState(null, '', '/ingredients');
  window.history.pushState = (...args) => {
    originalPushState(...args);
    notify();
  };
  window.history.replaceState = (...args) => {
    originalReplaceState(...args);
    notify();
  };
  window.addEventListener('popstate', notify);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  window.scrollTo = vi.fn() as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  window.history.pushState = originalPushState;
  window.history.replaceState = originalReplaceState;
  window.removeEventListener('popstate', notify);
  vi.unstubAllGlobals();
});

function Sheet({ rerenderOpener = false }: { rerenderOpener?: boolean }) {
  const sheet = useSheetRoute('picker');
  return (
    <>
      <button
        key={rerenderOpener && sheet.open ? 'a' : 'b'}
        data-sheet-opener="add"
        onClick={(e) => sheet.openSheet(e.currentTarget)}
      >
        재료 추가
      </button>
      <button data-back-button="">뒤로</button>
      {sheet.open ? (
        <div role="dialog">
          <button onClick={sheet.closeSheet}>닫기</button>
        </div>
      ) : null}
    </>
  );
}

// 뒤로가기는 비동기로 popstate를 낸다. 기다린 뒤 포커스 복귀 프레임까지 넘긴다
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

test('열면 쿼리가 붙고, 닫으면 기록을 되돌리며 연 버튼으로 포커스가 돌아온다', async () => {
  render(<Sheet />);
  const opener = screen.getByText('재료 추가');
  act(() => opener.click());
  assert.equal(new URLSearchParams(window.location.search).get('sheet'), 'picker');
  assert.ok(screen.getByRole('dialog'));

  act(() => screen.getByText('닫기').click());
  await settle();
  assert.equal(window.location.search, '');
  assert.equal(screen.queryByRole('dialog'), null);
  assert.equal(document.activeElement, screen.getByText('재료 추가'));
});

test('브라우저 뒤로가기로도 시트가 닫힌다', async () => {
  render(<Sheet />);
  act(() => screen.getByText('재료 추가').click());
  act(() => window.history.back());
  await settle();
  assert.equal(screen.queryByRole('dialog'), null);
});

test('연 버튼이 다시 그려졌으면 같은 뜻의 버튼으로 돌아온다', async () => {
  render(<Sheet rerenderOpener />);
  act(() => screen.getByText('재료 추가').click());
  act(() => screen.getByText('닫기').click());
  await settle();
  assert.equal(document.activeElement?.getAttribute('data-sheet-opener'), 'add');
});

test('주소로 바로 들어와 연 시트는 기록을 되돌리지 않고 쿼리만 지운다', async () => {
  originalReplaceState(null, '', '/ingredients?sheet=picker');
  const back = vi.spyOn(window.history, 'back');
  render(<Sheet />);
  assert.ok(screen.getByRole('dialog'));

  act(() => screen.getByText('닫기').click());
  await settle();
  assert.equal(back.mock.calls.length, 0);
  assert.equal(window.location.search, '');
  // 연 버튼을 모르므로 뒤로가기 버튼으로 돌아간다
  assert.equal(document.activeElement, screen.getByText('뒤로'));
});
