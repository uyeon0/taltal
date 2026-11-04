// @vitest-environment jsdom
// 헤더가 웹에서는 보이고 앱인토스 미니앱에서는 그려지지 않는지 확인한다.

import assert from 'node:assert/strict';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, test, vi } from 'vitest';

const env = vi.hoisted(() => ({ isAit: false }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));
vi.mock('@/shared/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/config')>();
  return {
    ...actual,
    get IS_AIT() {
      return env.isAit;
    }
  };
});

import { AppHeader } from './app-header';

afterEach(() => {
  cleanup();
  env.isAit = false;
});

test('웹에서는 헤더와 뒤로가기를 그린다', () => {
  const { container } = render(<AppHeader backHref="/" />);
  assert.ok(container.querySelector('header'));
  screen.getByRole('button', { name: '뒤로' });
});

test('미니앱에서는 헤더를 그리지 않고 여백만 남긴다', () => {
  env.isAit = true;
  const { container } = render(<AppHeader backHref="/" />);
  assert.equal(container.querySelector('header'), null);
  assert.equal(screen.queryByRole('button'), null);
  assert.ok(container.querySelector('[data-slot="app-header-spacer"]'));
});
