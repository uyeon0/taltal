// @vitest-environment jsdom
// 시작 홈의 행동을 확인한다.

import assert from 'node:assert/strict';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, test, vi } from 'vitest';
import { copy } from '@/shared/copy';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }) }));
// Embla는 브라우저 API가 필요해서 가짜로 바꾼다
vi.mock('embla-carousel-react', () => ({
  default: () => [
    () => undefined,
    {
      selectedScrollSnap: () => 0,
      scrollTo: vi.fn(),
      on() {
        return this;
      },
      off() {
        return this;
      }
    }
  ]
}));

import { SAMPLES } from '../model/samples';
import { HomePage } from './home-page';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('직접 고르기는 재료 선택 시트를 연 재료 입력으로 가는 링크다', () => {
  render(<HomePage />);
  const link = screen.getByRole('link', { name: copy.home.pickDirectly });
  assert.equal(link.getAttribute('href'), '/ingredients?sheet=ingredient-picker');
});

test('다람쥐 대체 텍스트는 비어 있다', () => {
  const { container } = render(<HomePage />);
  assert.equal(container.querySelector('main img')?.getAttribute('alt'), '');
});

test('제목 영역 다람쥐가 화면 폭에 맞춰 줄어드는 크기를 쓴다', () => {
  const { container } = render(<HomePage />);
  assert.ok(container.querySelector('main img')?.className.includes('size-(--mascot-header-size)'));
});

test('물음표는 다람쥐 그림에 들어 있어 따로 겹쳐 그리지 않는다', () => {
  const { container } = render(<HomePage />);
  const sources = [...container.querySelectorAll('main img')].map((img) => img.getAttribute('src') ?? '');
  assert.equal(sources.filter((src) => /question/.test(src)).length, 0);
});

test('직접 고르기 아래에 예시 구역 제목이 있다', () => {
  const { container } = render(<HomePage />);
  const heading = screen.getByRole('heading', { level: 2, name: copy.home.sampleTitle });
  const link = screen.getByRole('link', { name: copy.home.pickDirectly });
  assert.ok(link.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(container.querySelector('main img') !== null);
});

test('예시 묶음 세 장에 재료, 다 쓰는 재료, 요리가 있다', () => {
  render(<HomePage />);
  const region = screen.getByRole('region', { name: copy.home.sampleCarouselLabel });
  const slides = within(region).getAllByRole('group');
  assert.equal(slides.length, SAMPLES.length);
  SAMPLES.forEach((sample, i) => {
    const slide = within(slides[i]!);
    slide.getByText(sample.ingredients);
    slide.getByText(copy.results.titleAllUsed);
    for (const meal of sample.meals) slide.getAllByText(meal.uses);
  });
});

test('요리 순서를 화면 읽기에서 N번째 요리로 읽는다', () => {
  render(<HomePage />);
  const [first] = within(screen.getByRole('region', { name: copy.home.sampleCarouselLabel })).getAllByRole('group');
  const items = within(first!).getAllByRole('listitem');
  assert.equal(items.length, 3);
  items.forEach((item, i) =>
    assert.match(item.textContent ?? '', new RegExp(`^${i + 1}${copy.mealCard.order(i + 1)}`))
  );
});

test('묶음마다 따로 사요 줄이 있다', () => {
  render(<HomePage />);
  const slides = within(screen.getByRole('region', { name: copy.home.sampleCarouselLabel })).getAllByRole('group');
  SAMPLES.forEach((sample, i) => within(slides[i]!).getByText(copy.home.toBuy(sample.toBuy)));
});

test('예시 구역에는 링크와 버튼이 없다', () => {
  render(<HomePage />);
  const region = screen.getByRole('region', { name: copy.home.sampleCarouselLabel });
  assert.equal(within(region).queryAllByRole('link').length, 0);
  assert.equal(within(region).queryAllByRole('button').length, 0);
});
