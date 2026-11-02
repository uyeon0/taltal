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

import { Carousel } from './carousel';

const SLIDES = ['가', '나', '다'].map((text) => ({ key: text, content: <p>{text}</p> }));

beforeEach(() => {
  api.selected = 0;
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const slidesOf = (container: HTMLElement) => [...container.querySelectorAll('[aria-roledescription="slide"]')];

test('영역과 장에 캐러셀 이름과 장 이름이 있다', () => {
  const { container } = render(<Carousel label="이름" slides={SLIDES} />);
  screen.getByRole('region', { name: '이름' });
  assert.deepEqual(
    slidesOf(container).map((slide) => slide.getAttribute('aria-label')),
    [1, 2, 3].map((n) => copy.common.slideLabel(n, 3))
  );
});

test('보이는 장만 화면 읽기에 남는다', () => {
  const { container } = render(<Carousel label="이름" slides={SLIDES} />);
  assert.deepEqual(
    slidesOf(container).map((slide) => slide.getAttribute('aria-hidden')),
    ['false', 'true', 'true']
  );
});

test('점을 누르면 그 장으로 가고 현재 장에 aria-current가 있다', () => {
  render(<Carousel label="이름" slides={SLIDES} />);
  fireEvent.click(screen.getByRole('button', { name: copy.common.goToSlide(3) }));
  assert.deepEqual(api.scrollTo.mock.calls[0], [2, false]);
  assert.equal(screen.getByRole('button', { name: copy.common.goToSlide(1) }).getAttribute('aria-current'), 'true');
  assert.equal(screen.getByRole('button', { name: copy.common.goToSlide(2) }).getAttribute('aria-current'), null);
});

test('이전, 다음 버튼이 Embla를 부르고 끝에서 숨는다', () => {
  render(<Carousel label="이름" slides={SLIDES} />);
  const prev = screen.getByRole('button', { name: copy.common.prev });
  const next = screen.getByRole('button', { name: copy.common.next });
  assert.match(prev.className, /pointer-fine:invisible/);
  assert.doesNotMatch(next.className, /pointer-fine:invisible/);
  fireEvent.click(next);
  assert.equal(api.scrollNext.mock.calls.length, 1);
});

test('마지막 장에서는 다음 버튼이 숨는다', () => {
  api.selected = 2;
  render(<Carousel label="이름" slides={SLIDES} />);
  assert.match(screen.getByRole('button', { name: copy.common.next }).className, /pointer-fine:invisible/);
  assert.doesNotMatch(screen.getByRole('button', { name: copy.common.prev }).className, /pointer-fine:invisible/);
});

test('동작 줄이기에서는 움직임 없이 바로 옮긴다', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  render(<Carousel label="이름" slides={SLIDES} />);
  fireEvent.click(screen.getByRole('button', { name: copy.common.goToSlide(2) }));
  assert.deepEqual(api.scrollTo.mock.calls[0], [1, true]);
});

test('조작이 없으면 점 표시와 화살표가 없고 모든 장이 화면 읽기에 남는다', () => {
  const { container } = render(<Carousel label="이름" slides={SLIDES} controls={false} />);
  assert.equal(screen.queryAllByRole('button').length, 0);
  for (const slide of slidesOf(container)) {
    assert.equal(slide.getAttribute('aria-hidden'), null);
    assert.equal(slide.hasAttribute('inert'), false);
    assert.equal(slide.getAttribute('tabindex'), '0');
  }
});

test('조작이 없으면 포커스 외곽선을 장이 아니라 내용을 감싼 요소에 그린다', () => {
  const { container } = render(<Carousel label="이름" slides={SLIDES} controls={false} />);
  for (const slide of slidesOf(container)) {
    assert.match(slide.className, /(^|\s)group(\s|$)/);
    assert.match(slide.className, /focus-visible:outline-none/);
    const wrapper = slide.firstElementChild!;
    assert.match(wrapper.className, /group-focus-visible:outline-solid/);
    assert.equal(wrapper.firstElementChild?.tagName, 'P');
  }
});

test('조작이 있으면 내용을 감싸지 않는다', () => {
  const { container } = render(<Carousel label="이름" slides={SLIDES} />);
  for (const slide of slidesOf(container)) assert.equal(slide.firstElementChild?.tagName, 'P');
});

test('조작이 없으면 장에 포커스가 올 때 그 장으로 넘긴다', () => {
  const { container } = render(<Carousel label="이름" slides={SLIDES} controls={false} />);
  fireEvent.focus(slidesOf(container)[2]!);
  assert.deepEqual(api.scrollTo.mock.calls[0], [2, false]);
});

test('조작이 없을 때도 동작 줄이기에서는 움직임 없이 넘긴다', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const { container } = render(<Carousel label="이름" slides={SLIDES} controls={false} />);
  fireEvent.focus(slidesOf(container)[1]!);
  assert.deepEqual(api.scrollTo.mock.calls[0], [1, true]);
});

test('장 이동 점 버튼의 터치 영역이 44px 이상이다', () => {
  render(<Carousel label="예시" slides={SLIDES} />);
  const dot = screen.getByRole('button', { name: copy.common.goToSlide(1) });
  assert.ok(dot.className.includes('w-(--control-height)'));
  assert.ok(dot.className.includes('h-(--control-height)'));
});
