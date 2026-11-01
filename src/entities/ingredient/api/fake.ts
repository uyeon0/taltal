// 화면 작업과 테스트용 가짜 재료. 실제 데이터에서 옮기지 않고 손으로 만들었다.
// 실제 데이터가 없을 때 서버가 이 데이터를 쓴다.

import type { Ingredient } from '../model/types';

const food = (
  id: string,
  inputUnits: string[],
  unitGrams: Record<string, number>,
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
  food('대파', ['단', '대', 'g'], { 단: 800, 대: 100, 약간: 5 }, ['파', '다진파']),
  food('양파', ['개', 'g'], { 개: 200, 약간: 10 }, ['다진양파']),
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
