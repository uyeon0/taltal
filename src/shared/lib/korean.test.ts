import assert from 'node:assert/strict';
import { test } from 'vitest';

import { topicParticle } from './korean';

test('받침이 있으면 은, 없으면 는이다', () => {
  assert.equal(topicParticle('간장'), '은');
  assert.equal(topicParticle('마늘'), '은');
  assert.equal(topicParticle('소금'), '은');
  assert.equal(topicParticle('버터'), '는');
  assert.equal(topicParticle('식용유'), '는');
});

test('한글 음절이 아닌 글자로 끝나면 는이다', () => {
  assert.equal(topicParticle('MSG'), '는');
  assert.equal(topicParticle('7'), '는');
  assert.equal(topicParticle(''), '는');
});
