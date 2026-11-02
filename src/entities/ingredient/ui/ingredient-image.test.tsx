// @vitest-environment jsdom
// 재료 그림을 찾지 못하거나 불러오지 못하면 공통 대체 그림을 쓰는지 확인한다.

import assert from 'node:assert/strict';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, test } from 'vitest';

import { INGREDIENT_FALLBACK_IMAGE, INGREDIENT_IMAGES } from '../model/ingredient-images';
import { IngredientImage, ingredientImageSrc } from './ingredient-image';

afterEach(cleanup);

// next/image는 테스트 환경에서 주소 앞에 origin을 붙인다
const shownPath = (container: HTMLElement) => new URL(container.querySelector('img')!.src).pathname;

test('그림이 있는 재료는 그 그림을, 없는 재료는 대체 그림을 쓴다', () => {
  assert.equal(ingredientImageSrc('양파'), INGREDIENT_IMAGES['양파']);
  assert.equal(ingredientImageSrc('나중에 추가된 재료'), INGREDIENT_FALLBACK_IMAGE);
  // 객체 프로토타입의 이름도 대체 그림으로 간다
  assert.equal(ingredientImageSrc('constructor'), INGREDIENT_FALLBACK_IMAGE);
});

test('불러오지 못하면 대체 그림으로 바꾸고, 대체 그림도 실패하면 더 바꾸지 않는다', () => {
  const { container } = render(<IngredientImage ingredientId="양파" size={64} />);
  assert.equal(shownPath(container), INGREDIENT_IMAGES['양파']);
  assert.equal(container.querySelector('img')!.getAttribute('alt'), '');

  fireEvent.error(container.querySelector('img')!);
  assert.equal(shownPath(container), INGREDIENT_FALLBACK_IMAGE);

  fireEvent.error(container.querySelector('img')!);
  assert.equal(shownPath(container), INGREDIENT_FALLBACK_IMAGE);
});
