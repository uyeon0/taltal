// @vitest-environment jsdom
// 소개 장의 내용을 확인한다. 넘기기와 점 표시는 shared/ui/carousel.test.tsx가 확인한다.
// Embla는 브라우저 API가 필요해서 가짜로 바꾼다.

import assert from 'node:assert/strict';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, test, vi } from 'vitest';
import { copy } from '@/shared/copy';

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

import { IntroCarousel } from './intro-carousel';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('장 세 개와 단계 문구, 화면 모형 영역이 나온다', () => {
  const { container } = render(<IntroCarousel />);
  screen.getByRole('region', { name: copy.intro.carouselLabel });
  assert.equal(container.querySelectorAll('[aria-roledescription="slide"]').length, 3);
  for (const step of copy.intro.steps) screen.getByText(step, { selector: 'h2' });
  assert.equal(container.querySelectorAll('[data-slot="intro-preview"][aria-hidden="true"]').length, 3);
});

test('모형의 재료 그림은 대체 텍스트가 비어 있다', () => {
  const { container } = render(<IntroCarousel />);
  const images = [...container.querySelectorAll('img')];
  assert.ok(images.length > 0);
  assert.ok(images.every((img) => img.getAttribute('alt') === ''));
});

test('점 표시와 화살표가 있다', () => {
  render(<IntroCarousel />);
  screen.getByRole('button', { name: copy.common.goToSlide(1) });
  screen.getByRole('button', { name: copy.common.next });
});

test('장 제목은 줄을 바꾸지 않고 화면 폭에 맞춰 줄어드는 크기를 쓴다', () => {
  render(<IntroCarousel />);
  for (const step of copy.intro.steps) {
    const { className } = screen.getByText(step, { selector: 'h2' });
    assert.ok(className.includes('whitespace-nowrap'));
    assert.ok(className.includes('text-(length:--intro-step-title-size)'));
  }
});

test('모형은 화면 높이에 따라 내용을 숨기지 않는다', () => {
  const { container } = render(<IntroCarousel />);
  const previews = [...container.querySelectorAll('[data-slot="intro-preview"]')];
  assert.ok(previews.every((preview) => preview.querySelector('.hidden') === null));
});

test('1장은 재료 목록 머리 줄과 예시 재료를 모두 보여 준다', () => {
  const { container } = render(<IntroCarousel />);
  const [first] = container.querySelectorAll('[data-slot="intro-preview"]');
  const text = first.textContent ?? '';
  assert.ok(text.includes(copy.intro.exampleListLabel(copy.intro.exampleIngredients.length)));
  assert.ok(text.includes(copy.ingredients.servingsOption(2)));
  for (const { name, amount } of copy.intro.exampleIngredients) assert.ok(text.includes(name) && text.includes(amount));
});

test('2장은 요리마다 두부 양과 다른 재료를 한 줄로 쓴다', () => {
  const { container } = render(<IntroCarousel />);
  const second = container.querySelectorAll('[data-slot="intro-preview"]')[1];
  const [tofu] = copy.intro.exampleIngredients;
  for (const meal of copy.intro.exampleMeals) {
    within(second as HTMLElement).getByText([`${tofu.name} ${meal.amount}`, ...meal.others].join(' · '));
  }
});

test('3장은 1장의 재료마다 막대가 있고, 요리 색 설명은 요리명만 쓴다', () => {
  const { container } = render(<IntroCarousel />);
  const third = container.querySelectorAll('[data-slot="intro-preview"]')[2];
  const text = third.textContent ?? '';
  for (const usage of copy.intro.exampleMoreUsage)
    assert.ok(text.includes(usage.name) && text.includes(usage.leftover));
  assert.equal(copy.intro.exampleMoreUsage.length + 1, copy.intro.exampleIngredients.length);
  const legend = [...third.querySelectorAll('ul li')].map((item) => item.textContent);
  assert.deepEqual(
    legend,
    copy.intro.exampleMeals.map((meal) => meal.name)
  );
});
