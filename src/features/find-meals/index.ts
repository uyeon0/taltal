export type { Leftover, Meal, Result } from './model/types';
export { MAX_CANDIDATES, MAX_PURCHASES, PERISH_WEIGHT, filterCandidates, recommend } from './model/recommend';
export { DISH_COUNTS, compare, findMealOptions } from './model/compare';
export type { Comparison, Mode, Option } from './model/compare';
export { fetchCandidates } from './api/fetch-candidates';
