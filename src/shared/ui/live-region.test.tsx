// @vitest-environment jsdom
// 상태 메시지와 화면 로딩의 live region이 비운 채 나타났다가 마운트 뒤에 채워지는지 확인한다.
// 처음부터 글자를 담고 나타난 live region은 화면 읽기 프로그램이 읽지 않을 수 있기 때문이다.

import assert from 'node:assert/strict';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, test, vi } from 'vitest';

import { LoadingStatus } from './loading-status';
import { StatusMessage } from './status-message';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function liveRegionText(html: string, role: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.querySelector(`[role="${role}"]`)?.textContent ?? '없음';
}

test('상태 메시지는 처음에 비어 있다가 제목과 설명을 한 번 전달한다', async () => {
  const message = (
    <StatusMessage tone="error" title="요리를 불러오지 못했어요" description="넣은 재료는 그대로 있어요." />
  );
  assert.equal(liveRegionText(renderToString(message), 'alert'), '');

  render(message);
  assert.equal(screen.getByRole('alert').textContent, '');
  await waitFor(() =>
    assert.equal(screen.getByRole('alert').textContent, '요리를 불러오지 못했어요 넣은 재료는 그대로 있어요.')
  );
});

test('안내 상태 메시지는 status로 전달한다', async () => {
  render(<StatusMessage tone="info" title="준비 중이에요" />);
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, '준비 중이에요'));
});

test('화면 로딩은 처음에 비어 있다가 고정 안내를 전달한다', async () => {
  const loading = <LoadingStatus phrases={['찾고 있어요', '세고 있어요']} announcement="나눠 쓸 요리를 찾고 있어요" />;
  assert.equal(liveRegionText(renderToString(loading), 'status'), '');

  render(loading);
  assert.equal(screen.getByRole('status').textContent, '');
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, '나눠 쓸 요리를 찾고 있어요'));
});
