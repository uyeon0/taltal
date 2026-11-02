// 이미지 글에서 SUIT에 없는 글자를 바꾸거나 빼는지 확인한다.

import assert from 'node:assert/strict';
import { test } from 'vitest';

import { toImageText } from './recipe-image';

test('⅓ ⅔ ㎝ ∼를 바꾸고 ½ ¼ ¾는 그대로 둔다', () => {
  assert.equal(toImageText('⅓단, ⅔개, 5㎝, 2∼3분'), '1/3단, 2/3개, 5cm, 2~3분');
  assert.equal(toImageText('½개 ¼개 ¾개'), '½개 ¼개 ¾개');
});

test('전각 물음표는 반각으로, 한자만 든 괄호는 괄호째 뺀다', () => {
  assert.equal(toImageText('？잎장아찌'), '?잎장아찌');
  assert.equal(toImageText('나복저(蘿 菹)라고도 한다.'), '나복저라고도 한다.');
  assert.equal(toImageText('무(2개)를 썬다.'), '무(2개)를 썬다.');
});
