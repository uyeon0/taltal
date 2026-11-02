// @vitest-environment jsdom
// 레시피 상세 시트가 요구사항의 확인 기준대로 불러오고 보여 주는지 확인한다.

import assert from 'node:assert/strict';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, test, vi } from 'vitest';

import type { Meal } from '@/features/find-meals';
import type { Ingredient } from '@/entities/ingredient';
import type { Recipe, RecipeDetail } from '@/entities/recipe';
import { copy } from '@/shared/copy';

import { RecipeDetailSheet } from './recipe-detail-sheet';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const bean: Ingredient = {
  id: '콩나물',
  aliases: [],
  pantry: null,
  unitGrams: { 봉지: 300, g: 1 },
  inputUnits: ['봉지', 'g'],
  gramsSource: 'AI 추정'
};

const recipe = (id: number): Recipe => ({
  id,
  name: `요리${id}`,
  type: '밥',
  cookingTime: '40분',
  level: '보통',
  servingsOriginal: 4,
  ingredients: [
    { ingredientId: '콩나물', grams: 75, vague: false, amountText: '300g', role: '주재료' },
    { ingredientId: '참기름', grams: null, vague: false, amountText: '1큰술', role: '양념' }
  ]
});

const meal = (id: number): Meal => ({
  recipeId: id,
  name: `요리${id}`,
  uses: [{ ingredientId: '콩나물', grams: 150 }],
  toBuy: [],
  pantryNeeded: [],
  day: 3,
  urgency: null,
  urgentIngredients: []
});

const detail = (id: number): RecipeDetail => ({
  id,
  summary: `요약${id}`,
  steps: [
    { no: 2, text: '밥을 짓는다.', tip: '물은 적게 잡는다.' },
    { no: 1, text: '콩나물을 씻는다.', tip: null }
  ]
});

/** 요청마다 응답을 직접 정하는 fetch. 응답 전에 끊긴 요청도 기록한다 */
function stubFetch() {
  const calls: { url: string; init: RequestInit; signal: AbortSignal; respond: (res: Response) => void }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (url: string, init: RequestInit) =>
        new Promise<Response>((resolve) => calls.push({ url, init, signal: init.signal!, respond: resolve }))
    )
  );
  return calls;
}

const props = (id: number, open = true) => ({
  open,
  onOpenChange: () => {},
  meal: meal(id),
  recipe: recipe(id),
  shoppingList: [],
  ingredients: [bean],
  units: { 콩나물: '봉지' as const }
});

const flush = () => act(async () => {});

test('열면 그 레시피 하나만 요청하고, 받기 전에도 순서, 이름, 조리 시간, 재료를 보여 준다', async () => {
  const calls = stubFetch();
  render(<RecipeDetailSheet {...props(7)} />);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/recipes/7');
  assert.ok(screen.getByText(copy.mealCard.order(3)));
  assert.ok(screen.getByText(copy.mealCard.cookingTime('40분')));
  assert.ok(screen.getByText('½봉지'));
  assert.ok(screen.getAllByText(copy.recipeSheet.loading).length > 0);

  await act(async () => calls[0].respond(Response.json(detail(7))));
  assert.ok(screen.getByText('요약7'));
  const steps = screen.getAllByRole('listitem').filter((li) => li.textContent?.includes('.'));
  assert.ok(steps[0].textContent?.includes('콩나물을 씻는다.'));
  assert.ok(steps[1].textContent?.includes(`${copy.recipeSheet.tip} 물은 적게 잡는다.`));
});

test('양념 소제목에 원문 인분 기준을 붙인다', async () => {
  stubFetch();
  render(<RecipeDetailSheet {...props(7)} />);

  assert.ok(screen.getByText('1큰술'));
  const heading = screen.getByRole('heading', { level: 4, name: new RegExp(copy.recipeSheet.seasoningsTitle) });
  assert.ok(heading.textContent?.includes(copy.recipeSheet.seasoningsBasis(4)));
});

test('가진 재료의 원문 분량은 접혀 있다가 펼치면 원문 인분 안내와 함께 보인다', async () => {
  stubFetch();
  render(<RecipeDetailSheet {...props(7)} />);

  assert.equal(screen.queryByText('300g'), null);
  assert.equal(screen.queryByText(copy.recipeSheet.originalServings(4)), null);

  fireEvent.click(screen.getByRole('button', { name: copy.recipeSheet.originalAmounts }));
  assert.ok(screen.getByText('300g'));
  assert.ok(screen.getByText(copy.recipeSheet.originalServings(4)));
});

test('응답이 실패하면 시트 안에 오류를 보여 주고 재료는 그대로 둔다', async () => {
  const calls = stubFetch();
  render(<RecipeDetailSheet {...props(7)} />);
  await act(async () => calls[0].respond(Response.json({ error: '서버 오류' }, { status: 500 })));

  assert.ok(screen.getAllByText(copy.recipeSheet.error).length > 0);
  assert.ok(screen.getByText('½봉지'));
  assert.equal(screen.queryByText(copy.recipeSheet.stepsTitle), null);
});

test('닫으면 요청을 끊고, 다시 열면 새로 요청한다', async () => {
  const calls = stubFetch();
  const { rerender } = render(<RecipeDetailSheet {...props(7)} />);
  rerender(<RecipeDetailSheet {...props(7, false)} />);
  assert.equal(calls[0].signal.aborted, true);

  rerender(<RecipeDetailSheet {...props(7)} />);
  assert.equal(calls.length, 2);
  await flush();
});

test('다른 레시피로 바뀌면 늦게 온 이전 응답을 버린다', async () => {
  const calls = stubFetch();
  const { rerender } = render(<RecipeDetailSheet {...props(7)} />);
  rerender(<RecipeDetailSheet {...props(8)} />);
  assert.equal(calls.length, 2);

  await act(async () => calls[1].respond(Response.json(detail(8))));
  await act(async () => calls[0].respond(Response.json(detail(7))));
  assert.ok(screen.getByText('요약8'));
  assert.equal(screen.queryByText('요약7'), null);
});

test('연 요리가 새 결과에 없어 meal이 null이 돼도 마지막 내용을 그대로 보여 준다', async () => {
  const calls = stubFetch();
  const { rerender } = render(<RecipeDetailSheet {...props(7)} />);
  await act(async () => calls[0].respond(Response.json(detail(7))));

  rerender(<RecipeDetailSheet {...props(7)} meal={null} />);
  assert.ok(screen.getByText('요약7'));
  assert.ok(screen.getByText('½봉지'));
  assert.equal(calls.length, 1);
});

const saveButton = () => screen.getByRole('button', { name: copy.recipeSheet.saveImage });

test('상세를 받기 전에는 이미지 저장 버튼을 누를 수 없다', async () => {
  const calls = stubFetch();
  render(<RecipeDetailSheet {...props(7)} />);
  assert.equal((saveButton() as HTMLButtonElement).disabled, true);

  await act(async () => calls[0].respond(Response.json(detail(7))));
  assert.equal((saveButton() as HTMLButtonElement).disabled, false);
});

test('상세를 받지 못하면 이미지 저장 버튼을 누를 수 없다', async () => {
  const calls = stubFetch();
  render(<RecipeDetailSheet {...props(7)} />);
  await act(async () => calls[0].respond(Response.json({ error: '서버 오류' }, { status: 500 })));
  assert.equal((saveButton() as HTMLButtonElement).disabled, true);
});

test('누르면 화면에만 있는 양과 단위를 보내 이미지를 요청한다', async () => {
  const calls = stubFetch();
  const shoppingList = [{ ingredientId: '두부', grams: 100, optional: false }];
  render(<RecipeDetailSheet {...props(7)} shoppingList={shoppingList} />);
  await act(async () => calls[0].respond(Response.json(detail(7))));

  fireEvent.click(saveButton());
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, '/api/recipes/7/image');
  assert.equal(calls[1].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].init.body as string), {
    day: 3,
    uses: [{ ingredientId: '콩나물', grams: 150 }],
    toBuy: [],
    shoppingList,
    units: { 콩나물: '봉지' }
  });
  // 받는 동안 글자를 바꾸고 다시 누를 수 없다
  const saving = screen.getByRole('button', { name: copy.recipeSheet.savingImage });
  fireEvent.click(saving);
  assert.equal(calls.length, 2);
  await flush();
});

test('이미지를 받지 못하면 시트 안에 안내하고, 다시 누르면 안내를 지운다', async () => {
  const calls = stubFetch();
  render(<RecipeDetailSheet {...props(7)} />);
  await act(async () => calls[0].respond(Response.json(detail(7))));

  fireEvent.click(saveButton());
  await act(async () => calls[1].respond(new Response(null, { status: 500 })));
  assert.ok(screen.getAllByText(copy.recipeSheet.saveImageError).length > 0);
  assert.ok(screen.getByText('요약7'));

  fireEvent.click(saveButton());
  assert.equal(screen.queryAllByText(copy.recipeSheet.saveImageError).length, 0);
  await flush();
});

test('이미지를 받는 중에 닫으면 요청을 끊는다', async () => {
  const calls = stubFetch();
  const { rerender } = render(<RecipeDetailSheet {...props(7)} />);
  await act(async () => calls[0].respond(Response.json(detail(7))));

  fireEvent.click(saveButton());
  rerender(<RecipeDetailSheet {...props(7, false)} />);
  assert.equal(calls[1].signal.aborted, true);
  await flush();
});
