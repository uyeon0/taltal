// @vitest-environment jsdom
// 소개 화면의 구성과 접근성 기준을 확인한다.

import assert from 'node:assert/strict';
import { cleanup, render } from '@testing-library/react';
import { afterEach, test, vi } from 'vitest';
import { copy } from '@/shared/copy';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }) }));
vi.mock('./intro-carousel', () => ({ IntroCarousel: () => <div data-testid="carousel" /> }));

import { IntroPage } from './intro-page';

afterEach(cleanup);

test('/로 가는 링크가 없다', () => {
  const { container } = render(<IntroPage />);
  assert.equal(container.querySelectorAll('a[href="/"]').length, 0);
});

test('제목 영역에 대체 텍스트 없는 다람쥐가 있다', () => {
  const { container } = render(<IntroPage />);
  const mascot = container.querySelector('main img');
  assert.equal(mascot?.getAttribute('alt'), '');
  assert.match(mascot?.getAttribute('src') ?? '', /default/);
});

test('물음표는 다람쥐 그림에 들어 있어 따로 겹쳐 그리지 않는다', () => {
  const { container } = render(<IntroPage />);
  const sources = [...container.querySelectorAll('main img')].map((img) => img.getAttribute('src') ?? '');
  assert.equal(sources.filter((src) => /question/.test(src)).length, 0);
});

test('제목 영역 다람쥐가 화면 폭에 맞춰 줄어드는 크기를 쓴다', () => {
  const { container } = render(<IntroPage />);
  assert.ok(container.querySelector('main img')?.className.includes('size-(--mascot-header-size)'));
});

test('제목, 설명, 캐러셀, 시작 버튼이 순서대로 나온다', () => {
  const { container, getByRole, getByTestId } = render(<IntroPage />);
  getByRole('heading', { level: 1, name: copy.intro.title });
  getByTestId('carousel');
  getByRole('button', { name: copy.intro.start });
  assert.equal(container.querySelector('p')?.textContent, copy.intro.description);
});

test('설명은 제목과 다람쥐 줄 밖에서 화면 폭 전체를 쓴다', () => {
  const { container } = render(<IntroPage />);
  const row = container.querySelector('h1')?.parentElement;
  assert.ok(row?.querySelector('img'));
  assert.equal(row?.querySelector('p'), null);
  assert.ok(row?.parentElement?.querySelector(':scope > p'));
});

test('페이지 높이는 svh이고, 시작 버튼 영역은 화면 바닥에 고정한 만큼 아래를 비운다', () => {
  const { container, getByRole } = render(<IntroPage />);
  const main = container.querySelector('main');
  assert.ok(main?.className.includes('min-h-svh'));
  assert.ok(main?.className.includes('pb-(--intro-start-bar-height)'));
  const bar = getByRole('button', { name: copy.intro.start }).parentElement;
  assert.ok(bar?.className.includes('fixed'));
  assert.ok(bar?.className.includes('bottom-0'));
});
