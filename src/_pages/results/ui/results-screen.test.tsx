// @vitest-environment jsdom
// 결과 화면의 계산 상태와 복구가 요구사항의 확인 기준대로 동작하는지 확인한다.

import assert from 'node:assert/strict';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Activity, StrictMode } from 'react';
import { afterEach, beforeEach, test, vi } from 'vitest';

import type { Comparison, MealSearch, Result } from '@/features/find-meals';
import type { Ingredient } from '@/entities/ingredient';
import { copy } from '@/shared/copy';

const router = { replace: vi.fn(), push: vi.fn(), back: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(window.location.search)
}));
// 최소 표시 시간은 따로 테스트한다. 여기서는 기다리지 않는다
vi.mock('@/shared/lib/with-min-duration', () => ({ withMinDuration: <T,>(promise: Promise<T>) => promise }));

const searchMeals = vi.fn<(...args: unknown[]) => Promise<MealSearch>>();
vi.mock('@/features/find-meals', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/find-meals')>()),
  searchMeals: (...args: unknown[]) => searchMeals(...args)
}));

import { useInventory } from '@/features/build-inventory';
import { ResultsScreen } from './results-screen';

const tofu: Ingredient = {
  id: '두부',
  aliases: [],
  pantry: null,
  unitGrams: { 모: 300, g: 1 },
  inputUnits: ['모', 'g'],
  gramsSource: 'AI 추정',
  perishability: '빨리 상함'
};

// 서버가 넘기는 재료 목록처럼 다시 그려도 같은 배열이다
const INGREDIENTS = [tofu];

const result = (name: string, leftGrams: number, shoppingList: Result['shoppingList'] = []): Result => ({
  status: 'ok',
  meals: [1, 2, 3].map((day) => ({
    recipeId: day,
    name: `${name}${day}`,
    uses: [{ ingredientId: '두부', grams: 50 }],
    toBuy: [],
    pantryNeeded: [],
    day,
    urgency: '빨리 상함',
    urgentIngredients: ['두부']
  })),
  shoppingList,
  leftovers: [{ ingredientId: '두부', startGrams: 300, leftGrams }],
  leftoverRatio: leftGrams / 300,
  leftoverScore: (leftGrams / 300) * 3
});
const comparison = (...results: Result[]): Comparison => ({
  options: results.map((r) => ({ dishes: r.meals.length, result: r })),
  best: results.length - 1
});
const search = (noBuy: Comparison, buy: Comparison): MealSearch => ({ candidates: [], options: { noBuy, buy } });
const none = comparison();

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  // 계산 중 문구가 동작 줄이기를 확인한다
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  useInventory.getState().reset();
  useInventory.getState().addItems([{ ingredientId: '두부', unit: '모' }]);
  useInventory.getState().setAmount('두부', 1, '모');
  searchMeals.mockReset();
  router.replace.mockReset();
  window.history.replaceState(null, '', '/results');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('입력이 없으면 시작 홈으로 보내고 계산하지 않는다', () => {
  useInventory.getState().reset();
  render(<ResultsScreen ingredients={INGREDIENTS} />);
  assert.deepEqual(router.replace.mock.calls, [['/']]);
  assert.equal(searchMeals.mock.calls.length, 0);
});

test('저장소의 입력을 g으로 바꿔 한 번 계산하고, 사지 않는 묶음을 먼저 보여 준다', async () => {
  searchMeals.mockResolvedValue(search(comparison(result('사지않음', 150)), comparison(result('삼', 0))));
  render(<ResultsScreen ingredients={INGREDIENTS} />);
  screen.getByText(copy.loading.phrases[0]);

  await screen.findByRole('heading', { name: copy.results.title });
  assert.equal(searchMeals.mock.calls.length, 1);
  assert.deepEqual(searchMeals.mock.calls[0].slice(0, 2), [[{ ingredientId: '두부', grams: 300 }], 2]);
  screen.getByText('사지않음1');
  // 조금 사는 쪽이 사는 재료가 없으면 제안하지 않는다
  assert.equal(screen.queryByRole('button', { name: copy.purchaseMode.suggestButton }), null);
});

test('조금 사는 묶음이 덜 남으면 제안하고, 바꾸면 제목과 요리가 바뀐다', async () => {
  const buy = [{ ingredientId: '청고추', grams: 20, optional: false }];
  searchMeals.mockResolvedValue(search(comparison(result('사지않음', 150)), comparison(result('삼', 0, buy))));
  render(<ResultsScreen ingredients={INGREDIENTS} />);

  fireEvent.click(await screen.findByRole('button', { name: copy.purchaseMode.suggestButton }));
  const title = screen.getByRole('heading', { name: copy.results.titleWithPurchase });
  assert.equal(document.activeElement, title);
  screen.getByText('삼1');

  fireEvent.click(screen.getByRole('button', { name: copy.purchaseMode.backToNoPurchase }));
  screen.getByRole('heading', { name: copy.results.title });
});

test('사지 않는 묶음이 없으면 조금 사는 묶음을 이유와 함께 보여 준다', async () => {
  searchMeals.mockResolvedValue(search(none, comparison(result('삼', 0))));
  render(<ResultsScreen ingredients={INGREDIENTS} />);

  await screen.findByRole('heading', { name: copy.results.titleWithPurchase });
  // StatusMessage는 화면 읽기용 글자를 따로 둔다
  assert.ok(screen.getAllByText(copy.purchaseMode.noPurchaseUnavailable).length > 0);
  assert.equal(screen.queryByRole('button', { name: copy.purchaseMode.backToNoPurchase }), null);
});

test('연결이 끊겨도 오류 화면에 다람쥐를 보여 줄 수 있게 미리 받아 둔다', () => {
  searchMeals.mockReturnValue(new Promise(() => {}));
  render(<ResultsScreen ingredients={INGREDIENTS} />);
  assert.ok(document.head.querySelector('link[rel="preload"][as="image"][href="/images/mascot/retry.png"]'));
});

test('두 묶음 모두 없으면 추천 없음을 보여 준다', async () => {
  searchMeals.mockResolvedValue(search(none, none));
  render(<ResultsScreen ingredients={INGREDIENTS} />);

  await screen.findByRole('button', { name: copy.recovery.emptyAction });
  assert.ok(screen.getAllByText(copy.recovery.emptyTitle).length > 0);
});

test('오류에서 다시 찾기는 같은 입력으로 다시 계산한다', async () => {
  searchMeals.mockRejectedValueOnce(new Error('500'));
  searchMeals.mockResolvedValueOnce(search(comparison(result('다시', 150)), none));
  render(<ResultsScreen ingredients={INGREDIENTS} />);

  fireEvent.click(await screen.findByRole('button', { name: copy.recovery.errorRetry }));
  await screen.findByText('다시1');
  assert.equal(searchMeals.mock.calls.length, 2);
  assert.deepEqual(searchMeals.mock.calls[1].slice(0, 2), searchMeals.mock.calls[0].slice(0, 2));
});

test('늦게 온 이전 응답이 새 결과를 덮어쓰지 않는다', async () => {
  // Strict Mode는 효과를 두 번 돌려 계산이 여러 번 시작된다. 먼저 시작한 계산이 나중에 끝나는 경우다
  const first = deferred<MealSearch>();
  const later = deferred<MealSearch>();
  searchMeals.mockReturnValueOnce(first.promise).mockReturnValue(later.promise);
  render(
    <StrictMode>
      <ResultsScreen ingredients={INGREDIENTS} />
    </StrictMode>
  );
  assert.ok(searchMeals.mock.calls.length >= 2);

  later.resolve(search(comparison(result('새', 150)), none));
  await screen.findByText('새1');
  await act(async () => first.resolve(search(comparison(result('옛', 150)), none)));
  assert.equal(screen.queryByText('옛1'), null);
  screen.getByText('새1');
});

test('가짓수 탭을 바꾸면 그 결과의 요리를 보여 준다', async () => {
  const four: Result = {
    ...result('넷', 30),
    meals: [...result('넷', 30).meals, { ...result('넷', 30).meals[0], recipeId: 4, name: '넷4', day: 4 }]
  };
  searchMeals.mockResolvedValue(search(comparison(result('셋', 150), four), none));
  render(<ResultsScreen ingredients={INGREDIENTS} />);

  const tab = await screen.findByRole('tab', { name: copy.results.dishCountTab(4) });
  assert.equal(tab.getAttribute('aria-selected'), 'true');
  screen.getByText('넷4');
  const three = screen.getByRole('tab', { name: copy.results.dishCountTab(3) });
  fireEvent.mouseDown(three);
  fireEvent.click(three);
  await screen.findByText('셋1');
  assert.equal(screen.queryByText('넷4'), null);
});

test('숨겼다 다시 보이면 이전 결과 없이 계산 중부터 시작해, 그때의 입력으로 다시 계산한다', async () => {
  // cacheComponents에서 Next.js는 떠난 화면을 Activity로 숨긴다
  const view = (mode: 'visible' | 'hidden') => (
    <Activity mode={mode}>
      <ResultsScreen ingredients={INGREDIENTS} />
    </Activity>
  );
  searchMeals.mockResolvedValue(search(comparison(result('처음', 150)), none));
  const { rerender } = render(view('visible'));
  await screen.findByText('처음1');

  // 재료 수정으로 가서 인분을 바꾸고 요리 찾기로 돌아온다
  rerender(view('hidden'));
  act(() => useInventory.getState().setServings(3));
  const next = deferred<MealSearch>();
  searchMeals.mockReturnValueOnce(next.promise);
  rerender(view('visible'));
  assert.equal(screen.queryByText('처음1'), null);
  screen.getByText(copy.loading.phrases[0]);
  assert.equal(searchMeals.mock.calls.length, 2);
  assert.equal(searchMeals.mock.calls[1][1], 3);

  next.resolve(search(comparison(result('바뀜', 150)), none));
  await screen.findByText('바뀜1');
});
