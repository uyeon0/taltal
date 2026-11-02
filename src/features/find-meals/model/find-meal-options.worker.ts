// 두 묶음을 3·4·5가지씩 계산하는 Web Worker. 계산이 길어도 화면 입력을 멈추지 않게 한다.

import { findMealOptions } from './compare';
import type { FindMealOptionsRequest, FindMealOptionsResponse } from './worker-messages';

self.onmessage = (event: MessageEvent<FindMealOptionsRequest>) => {
  const { inventory, servings, candidates, ingredients } = event.data;
  let response: FindMealOptionsResponse;
  try {
    response = { ok: true, options: findMealOptions(inventory, servings, { candidates, ingredients }) };
  } catch (error) {
    response = { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
  self.postMessage(response);
};
