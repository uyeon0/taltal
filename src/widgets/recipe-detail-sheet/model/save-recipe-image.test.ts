// @vitest-environment jsdom
// 이미지 저장이 공유 시트와 내려받기 중 맞는 쪽을 고르는지 확인한다. 공유 시트는 아이폰, 아이패드에서만 연다.

import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

import { recipeImageFileName, saveImage } from './save-recipe-image';

const blob = new Blob(['png'], { type: 'image/png' });

/** a.click()으로 내려받은 파일 이름을 모은다 */
function spyDownload() {
  const names: string[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    names.push(this.download);
  });
  URL.createObjectURL = vi.fn(() => 'blob:image');
  URL.revokeObjectURL = vi.fn();
  return names;
}

function stubShare(share: (data: ShareData) => Promise<void>, canShare = true) {
  const shareFn = vi.fn(share);
  Object.defineProperty(navigator, 'canShare', { value: () => canShare, configurable: true });
  Object.defineProperty(navigator, 'share', { value: shareFn, configurable: true });
  return shareFn;
}

const DEVICES = {
  iPhone: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15', touch: 5 },
  // 아이패드는 맥으로 알린다
  iPad: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', touch: 5 },
  mac: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', touch: 0 },
  android: { userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S921N) AppleWebKit/537.36 Chrome/140.0', touch: 5 },
  windows: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0', touch: 0 }
} as const;

function stubDevice(device: keyof typeof DEVICES) {
  Object.defineProperty(navigator, 'userAgent', { value: DEVICES[device].userAgent, configurable: true });
  Object.defineProperty(navigator, 'maxTouchPoints', { value: DEVICES[device].touch, configurable: true });
}

// 따로 정하지 않은 테스트는 아이폰이다
beforeEach(() => stubDevice('iPhone'));

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as Partial<Navigator>).canShare;
  delete (navigator as Partial<Navigator>).share;
  // 읽기 전용 속성이라 delete 대신 지운다. 지우면 jsdom 기본값으로 돌아간다
  Reflect.deleteProperty(navigator, 'userAgent');
  Reflect.deleteProperty(navigator, 'maxTouchPoints');
});

test('안드로이드와 PC에서는 파일 공유를 지원해도 공유 창을 열지 않고 내려받는다', async () => {
  for (const device of ['android', 'windows', 'mac'] as const) {
    stubDevice(device);
    const downloads = spyDownload();
    const share = stubShare(async () => {});
    await saveImage(blob, '탈탈-콩나물밥.png');

    assert.equal(share.mock.calls.length, 0, device);
    assert.deepEqual(downloads, ['탈탈-콩나물밥.png'], device);
    vi.restoreAllMocks();
  }
});

test('아이패드도 공유 시트를 연다', async () => {
  stubDevice('iPad');
  spyDownload();
  const share = stubShare(async () => {});
  await saveImage(blob, 'a.png');
  assert.equal(share.mock.calls.length, 1);
});

test('아이폰에서 파일 공유를 지원하면 공유 시트를 열고 내려받지 않는다', async () => {
  const downloads = spyDownload();
  const share = stubShare(async () => {});
  await saveImage(blob, '탈탈-콩나물밥.png');

  assert.equal(share.mock.calls.length, 1);
  const file = (share.mock.calls[0][0].files ?? [])[0];
  assert.equal(file.name, '탈탈-콩나물밥.png');
  assert.equal(file.type, 'image/png');
  assert.deepEqual(downloads, []);
});

test('파일 공유를 지원하지 않으면 내려받는다', async () => {
  const downloads = spyDownload();
  await saveImage(blob, '탈탈-콩나물밥.png');
  assert.deepEqual(downloads, ['탈탈-콩나물밥.png']);

  const share = stubShare(async () => {}, false);
  await saveImage(blob, '탈탈-콩나물밥.png');
  assert.equal(share.mock.calls.length, 0);
  assert.equal(downloads.length, 2);
});

test('공유 시트를 닫으면 조용히 끝내고 내려받지 않는다', async () => {
  const downloads = spyDownload();
  stubShare(() => Promise.reject(new DOMException('취소', 'AbortError')));
  await saveImage(blob, 'a.png');
  assert.deepEqual(downloads, []);
});

test('사용자 동작 시간이 지나 공유가 막히면 내려받는다', async () => {
  const downloads = spyDownload();
  stubShare(() => Promise.reject(new DOMException('막힘', 'NotAllowedError')));
  await saveImage(blob, 'a.png');
  assert.deepEqual(downloads, ['a.png']);
});

test('그 밖의 공유 오류는 던진다', async () => {
  spyDownload();
  stubShare(() => Promise.reject(new TypeError('실패')));
  await assert.rejects(saveImage(blob, 'a.png'), TypeError);
});

test('파일 이름에 쓸 수 없는 문자는 -로 바꾼다', () => {
  assert.equal(recipeImageFileName('김치/참치 "볶음밥"?'), '탈탈-김치-참치 -볶음밥--.png');
});
