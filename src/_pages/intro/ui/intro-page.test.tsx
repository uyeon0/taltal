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

test('머리글 쪽에 대체 텍스트 없는 다람쥐가 있다', () => {
  const { container } = render(<IntroPage />);
  const mascot = container.querySelector('main img');
  assert.equal(mascot?.getAttribute('alt'), '');
  assert.match(mascot?.getAttribute('src') ?? '', /default/);
});

test('머리글 다람쥐 옆에 물음표가 있고 대체 텍스트가 비어 있다', () => {
  const { container } = render(<IntroPage />);
  const [, question] = [...container.querySelectorAll('main img')];
  assert.match(question?.getAttribute('src') ?? '', /question/);
  assert.equal(question?.getAttribute('alt'), '');
});

test('제목, 설명, 캐러셀, 시작 버튼이 순서대로 나온다', () => {
  const { container, getByRole, getByTestId } = render(<IntroPage />);
  getByRole('heading', { level: 1, name: copy.intro.title });
  getByTestId('carousel');
  getByRole('button', { name: copy.intro.start });
  assert.equal(container.querySelector('p')?.textContent, copy.intro.description);
});
