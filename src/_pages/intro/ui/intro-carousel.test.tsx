// @vitest-environment jsdom
// 캐러셀의 버튼, 점 표시, 접근성 속성을 확인한다. Embla는 브라우저 API가 필요해서 가짜로 바꾼다.

import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, test, vi } from 'vitest';
import { copy } from '@/shared/copy';

const api = vi.hoisted(() => ({
  selected: 0,
  scrollTo: vi.fn(),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  handlers: new Map<string, () => void>()
}));

vi.mock('embla-carousel-react', () => ({
  default: () => [
    () => undefined,
    {
      selectedScrollSnap: () => api.selected,
      scrollTo: api.scrollTo,
      scrollPrev: api.scrollPrev,
      scrollNext: api.scrollNext,
      on(event: string, handler: () => void) {
        api.handlers.set(event, handler);
        return this;
      },
      off() {
        return this;
      }
    }
  ]
}));

import { IntroCarousel } from './intro-carousel';

beforeEach(() => {
  api.selected = 0;
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

test('장 세 개와 단계 문구, 화면 모형 영역이 나온다', () => {
  const { container } = render(<IntroCarousel />);
  assert.equal(container.querySelectorAll('[aria-roledescription="slide"]').length, 3);
  for (const step of copy.intro.steps) screen.getByText(step, { selector: 'h2' });
  assert.equal(container.querySelectorAll('[data-slot="intro-preview"][aria-hidden="true"]').length, 3);
});

test('다람쥐 대체 텍스트는 비어 있다', () => {
  const { container } = render(<IntroCarousel />);
  const images = [...container.querySelectorAll('img')];
  assert.equal(images.length, 3);
  assert.ok(images.every((img) => img.getAttribute('alt') === ''));
});

test('보이는 장만 화면 읽기에 남는다', () => {
  const { container } = render(<IntroCarousel />);
  const hidden = [...container.querySelectorAll('[aria-roledescription="slide"]')].map((slide) =>
    slide.getAttribute('aria-hidden')
  );
  assert.deepEqual(hidden, ['false', 'true', 'true']);
});

test('점을 누르면 그 장으로 가고 현재 장에 aria-current가 있다', () => {
  render(<IntroCarousel />);
  fireEvent.click(screen.getByRole('button', { name: copy.intro.goToSlide(3) }));
  assert.deepEqual(api.scrollTo.mock.calls[0], [2, false]);
  assert.equal(screen.getByRole('button', { name: copy.intro.goToSlide(1) }).getAttribute('aria-current'), 'true');
  assert.equal(screen.getByRole('button', { name: copy.intro.goToSlide(2) }).getAttribute('aria-current'), null);
});

test('이전, 다음 버튼이 Embla를 부르고 끝에서 숨는다', () => {
  render(<IntroCarousel />);
  const prev = screen.getByRole('button', { name: copy.intro.prev });
  const next = screen.getByRole('button', { name: copy.intro.next });
  assert.match(prev.className, /pointer-fine:invisible/);
  assert.doesNotMatch(next.className, /pointer-fine:invisible/);
  fireEvent.click(next);
  assert.equal(api.scrollNext.mock.calls.length, 1);
});

test('마지막 장에서는 다음 버튼이 숨는다', () => {
  api.selected = 2;
  render(<IntroCarousel />);
  assert.match(screen.getByRole('button', { name: copy.intro.next }).className, /pointer-fine:invisible/);
  assert.doesNotMatch(screen.getByRole('button', { name: copy.intro.prev }).className, /pointer-fine:invisible/);
});

test('동작 줄이기에서는 움직임 없이 바로 옮긴다', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  render(<IntroCarousel />);
  fireEvent.click(screen.getByRole('button', { name: copy.intro.goToSlide(2) }));
  assert.deepEqual(api.scrollTo.mock.calls[0], [1, true]);
});
