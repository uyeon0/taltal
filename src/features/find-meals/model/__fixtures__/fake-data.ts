// 테스트 전용 가짜 데이터. 실제 데이터에서 옮기지 않고 손으로 만들었다.
// 앱은 이 데이터를 쓰지 않는다. 실제 데이터가 없으면 서버가 오류를 돌려준다.

import type { Ingredient, InputUnit, Stock } from '@/entities/ingredient';
import type { Recipe } from '@/entities/recipe';

const food = (
  id: string,
  inputUnits: InputUnit[],
  unitGrams: Partial<Record<InputUnit, number>>,
  aliases: string[] = []
): Ingredient => ({
  id,
  aliases,
  pantry: null,
  unitGrams: { g: 1, ...unitGrams },
  inputUnits,
  gramsSource: 'AI 추정'
});

const pantry = (id: string, tier: '기본' | '특수'): Ingredient => ({
  id,
  aliases: [],
  pantry: tier,
  unitGrams: {},
  inputUnits: [],
  gramsSource: null
});

export const fakeIngredients: Ingredient[] = [
  food('대파', ['단', '대', 'g'], { 단: 800, 대: 100 }, ['파', '다진파']),
  food('양파', ['개', 'g'], { 개: 200 }, ['다진양파']),
  food('계란', ['개', 'g'], { 개: 50 }, ['달걀']),
  food('두부', ['모', 'g'], { 모: 300 }),
  food('애호박', ['개', 'g'], { 개: 300 }, ['호박']),
  food('감자', ['개', 'g'], { 개: 150 }),
  food('당근', ['개', 'g'], { 개: 200 }),
  food('쇠고기', ['g'], {}, ['소고기']),
  food('돼지고기', ['g'], {}),
  food('김치', ['포기', 'g'], { 포기: 1500 }, ['배추김치', '신김치']),
  food('표고버섯', ['개', 'g'], { 개: 20 }, ['표고']),
  food('홍고추', ['개', 'g'], { 개: 10 }),
  food('청고추', ['개', 'g'], { 개: 10 }, ['풋고추']),
  food('밥', ['공기', 'g'], { 공기: 210 }, ['찬밥']),
  pantry('소금', '기본'),
  pantry('설탕', '기본'),
  pantry('간장', '기본'),
  pantry('참기름', '기본'),
  pantry('고춧가루', '기본'),
  pantry('식용유', '기본'),
  pantry('된장', '기본'),
  pantry('고추장', '기본'),
  pantry('마늘', '특수'),
  pantry('굴소스', '특수'),
  pantry('맛술', '특수'),
  pantry('다시마', '특수')
];

/**
 * 가짜 데이터로 화면 상태를 재현하는 재료 묶음(1인분 기준).
 * - normal: 사지 않는 묶음으로 3·4·5가지가 모두 나온다
 * - withPurchase: 조금 사는 묶음이 사지 않는 묶음과 다르다
 * - partial: 사지 않는 묶음으로 요청보다 적게 나온다
 * - empty: 두 묶음 모두 추천이 없다
 */
const basket = (amounts: Record<string, number>): Stock[] =>
  Object.entries(amounts).map(([ingredientId, grams]) => ({ ingredientId, grams }));

export const fakeBaskets = {
  normal: basket({
    계란: 500,
    대파: 800,
    두부: 600,
    애호박: 600,
    양파: 400,
    감자: 600,
    당근: 400,
    돼지고기: 600,
    김치: 1500,
    밥: 630,
    홍고추: 50,
    청고추: 50,
    표고버섯: 200,
    쇠고기: 400
  }),
  withPurchase: basket({ 계란: 500, 대파: 800, 두부: 300, 애호박: 300, 양파: 200 }),
  partial: basket({ 감자: 300, 당근: 200 }),
  empty: basket({ 쇠고기: 50 })
};

// 가짜 재료 중 양념. 레시피 재료의 역할(양념인지)을 정하는 데 쓴다
const pantryIds = new Set([
  '소금',
  '설탕',
  '간장',
  '참기름',
  '고춧가루',
  '식용유',
  '된장',
  '고추장',
  '마늘',
  '굴소스',
  '맛술',
  '다시마'
]);

type Line = [ingredientId: string, gramsPerServing: number | null, amountText: string];

let nextId = 1;
const recipe = (name: string, type: string, cookingTime: string, servingsOriginal: number, lines: Line[]): Recipe => ({
  id: nextId++,
  name,
  type,
  cookingTime,
  level: '초보환영',
  servingsOriginal,
  ingredients: lines.map(([ingredientId, grams, amountText]) => ({
    ingredientId,
    grams,
    amountText,
    role: pantryIds.has(ingredientId) ? '양념' : '주재료',
    vague: !pantryIds.has(ingredientId) && amountText === '약간'
  }))
});

export const fakeRecipes: Recipe[] = [
  recipe('계란말이', '반찬', '15분', 2, [
    ['계란', 100, '4개'],
    ['대파', 10, '1/5대'],
    ['당근', 15, '약간'],
    ['소금', null, '약간'],
    ['식용유', null, '1큰술']
  ]),
  recipe('두부조림', '조림', '25분', 2, [
    ['두부', 150, '1모'],
    ['대파', 15, '1/3대'],
    ['간장', null, '3큰술'],
    ['고춧가루', null, '1큰술'],
    ['마늘', null, '1작은술']
  ]),
  recipe('애호박전', '부침', '20분', 2, [
    ['애호박', 150, '1/2개'],
    ['계란', 50, '1개'],
    ['소금', null, '약간'],
    ['식용유', null, '2큰술']
  ]),
  recipe('된장찌개', '찌개', '25분', 2, [
    ['두부', 75, '1/2모'],
    ['애호박', 75, '1/4개'],
    ['양파', 50, '1/2개'],
    ['대파', 10, '약간'],
    ['청고추', 5, '1/2개'],
    ['된장', null, '2큰술'],
    ['다시마', null, '1장']
  ]),
  recipe('김치찌개', '찌개', '30분', 2, [
    ['김치', 150, '1/4포기'],
    ['돼지고기', 100, '200g'],
    ['두부', 75, '1/2모'],
    ['대파', 15, '1/3대'],
    ['고춧가루', null, '1큰술']
  ]),
  recipe('감자볶음', '볶음', '20분', 2, [
    ['감자', 150, '2개'],
    ['당근', 30, '1/4개'],
    ['양파', 30, '1/4개'],
    ['소금', null, '약간'],
    ['식용유', null, '2큰술']
  ]),
  recipe('제육볶음', '볶음', '30분', 2, [
    ['돼지고기', 150, '300g'],
    ['양파', 50, '1/2개'],
    ['대파', 20, '1/2대'],
    ['홍고추', 5, '1/2개'],
    ['고추장', null, '2큰술'],
    ['마늘', null, '1큰술']
  ]),
  recipe('김치볶음밥', '밥', '15분', 1, [
    ['밥', 210, '1공기'],
    ['김치', 80, '1/2컵'],
    ['계란', 50, '1개'],
    ['대파', 10, '약간'],
    ['식용유', null, '1큰술']
  ]),
  recipe('계란국', '국', '10분', 2, [
    ['계란', 50, '2개'],
    ['대파', 10, '약간'],
    ['소금', null, '약간'],
    ['다시마', null, '1장']
  ]),
  recipe('소고기버섯볶음', '볶음', '20분', 2, [
    ['쇠고기', 100, '200g'],
    ['표고버섯', 40, '4개'],
    ['양파', 50, '1/2개'],
    ['간장', null, '2큰술'],
    ['굴소스', null, '1큰술']
  ]),
  recipe('애호박두부찌개', '찌개', '25분', 2, [
    ['애호박', 100, '1/3개'],
    ['두부', 100, '2/3모'],
    ['대파', 10, '약간'],
    ['홍고추', 5, '1/2개'],
    ['고춧가루', null, '1큰술']
  ]),
  recipe('감자조림', '조림', '30분', 2, [
    ['감자', 150, '2개'],
    ['당근', 30, '1/4개'],
    ['간장', null, '3큰술'],
    ['설탕', null, '1큰술']
  ])
];
