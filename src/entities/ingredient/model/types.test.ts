// 재료 데이터의 입력 단위가 타입(INPUT_UNITS)과 맞는지 확인한다. 타입만으로는 JSON의 값을 검사하지 못하기 때문이다.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

import { INPUT_UNITS, type Ingredient } from './types';

const dataDir = process.env.APP_DATA_DIR ?? path.join(process.cwd(), 'data', 'app');
const dataFile = path.join(dataDir, 'ingredients.json');
const real: Ingredient[] = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf-8')) : [];

const allowed = new Set<string>(INPUT_UNITS);

function checkUnits(ingredients: Ingredient[]) {
  for (const ing of ingredients) {
    const units = ing.inputUnits as string[];
    const keys = Object.keys(ing.unitGrams);
    for (const u of units) assert.ok(allowed.has(u), `${ing.id}: INPUT_UNITS에 없는 단위 "${u}". INPUT_UNITS에 더한다`);
    assert.deepEqual([...keys].sort(), [...units].sort(), `${ing.id}: unitGrams 키와 inputUnits가 다르다`);
    if (ing.pantry === null) {
      assert.equal(units.at(-1), 'g', `${ing.id}: inputUnits의 마지막은 g이어야 한다`);
      assert.equal(ing.unitGrams.g, 1, `${ing.id}: g은 1이어야 한다`);
    } else {
      assert.equal(units.length, 0, `${ing.id}: 양념은 입력 단위가 없어야 한다`);
    }
  }
}

test.skipIf(real.length === 0)('실제 재료의 입력 단위가 INPUT_UNITS 안에 있고 unitGrams 키와 같다', () => {
  checkUnits(real);
});
