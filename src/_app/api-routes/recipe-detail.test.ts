// 레시피 번호 검사. 숫자로 읽히는 다른 표기는 데이터를 읽기 전에 400으로 막는다.

import assert from 'node:assert/strict';
import { test } from 'vitest';

import { GET } from './recipe-detail';

const call = (id: string) =>
  GET(new Request(`http://localhost/api/recipes/${id}`), { params: Promise.resolve({ id }) });

test('숫자만으로 된 번호가 아니면 400이다', async () => {
  for (const id of ['0x10', '1e1', '12.0', ' 12 ', '-1', 'abc', '', '007']) {
    assert.equal((await call(id)).status, 400, id);
  }
});
