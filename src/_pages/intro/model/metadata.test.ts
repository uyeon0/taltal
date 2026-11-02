import assert from 'node:assert/strict';
import { test } from 'vitest';
import { copy } from '@/shared/copy';
import { metadata } from './metadata';

test('브라우저 탭 제목이 문구 파일의 화면 제목이다', () => {
  assert.equal(metadata.title, copy.pageTitle.intro);
});
