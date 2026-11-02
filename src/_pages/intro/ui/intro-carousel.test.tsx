// @vitest-environment jsdom
// 소개 장의 내용을 확인한다. 넘기기와 점 표시는 shared/ui/carousel.test.tsx가 확인한다.
// Embla는 브라우저 API가 필요해서 가짜로 바꾼다.

import assert from 'node:assert/strict';
import { cleanup, render, screen } from '@testing-library/react';
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

test('다람쥐 대체 텍스트는 비어 있다', () => {
  const { container } = render(<IntroCarousel />);
  const images = [...container.querySelectorAll('img')];
  assert.equal(images.length, 3);
  assert.ok(images.every((img) => img.getAttribute('alt') === ''));
});

test('점 표시와 화살표가 있다', () => {
  render(<IntroCarousel />);
  screen.getByRole('button', { name: copy.common.goToSlide(1) });
  screen.getByRole('button', { name: copy.common.next });
});
