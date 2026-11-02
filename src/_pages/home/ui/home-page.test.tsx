// @vitest-environment jsdom
// 시작 홈의 행동을 확인한다.

import assert from 'node:assert/strict';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, test, vi } from 'vitest';
import { copy } from '@/shared/copy';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }) }));

import { HomePage } from './home-page';

afterEach(cleanup);

test('직접 고르기는 재료 선택 시트를 연 재료 입력으로 가는 링크다', () => {
  render(<HomePage />);
  const link = screen.getByRole('link', { name: copy.home.pickDirectly });
  assert.equal(link.getAttribute('href'), '/ingredients?sheet=ingredient-picker');
});

test('다람쥐 대체 텍스트는 비어 있다', () => {
  const { container } = render(<HomePage />);
  assert.equal(container.querySelector('main img')?.getAttribute('alt'), '');
});
