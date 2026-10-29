// 앱 데이터를 읽는다. 서버에서만 쓴다.
// data/app/(또는 APP_DATA_DIR)에 JSON(ingredients.json, recipes.json, recipe-steps.json)이 있으면 그것을,
// 없으면 화면 작업용 가짜 데이터를 쓴다. 실제 데이터는 비공개 저장소 camp-project-1-data의 app/에 있고,
// 배포할 때 GitHub Actions가 data/app/에 복사한다. 공개 저장소인 이곳에는 커밋하지 않는다(.gitignore).

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const dataDir = process.env.APP_DATA_DIR ?? path.join(process.cwd(), "data", "app");
const hasData = existsSync(path.join(dataDir, "ingredients.json"));

import { fakeDetails, fakeIngredients, fakeRecipes } from "@/data/fake";
import type { Ingredient, Recipe } from "@/logic/types";

export type RecipeDetail = {
  id: number;
  summary: string;
  steps: { no: number; text: string; tip: string | null }[];
};

async function load<T>(file: string, fallback: T): Promise<T> {
  if (!hasData) return fallback;
  return JSON.parse(await readFile(path.join(dataDir, file), "utf-8")) as T;
}

export async function getIngredients(): Promise<Ingredient[]> {
  "use cache";
  return load("ingredients.json", fakeIngredients);
}

export async function getRecipes(): Promise<Recipe[]> {
  "use cache";
  return load("recipes.json", fakeRecipes);
}

export async function getRecipeDetail(id: number): Promise<RecipeDetail | null> {
  "use cache";
  // recipe-steps.json은 레시피 id를 키로 한 객체다
  const details = await load<Record<string, RecipeDetail>>("recipe-steps.json", fakeDetails);
  return details[String(id)] ?? null;
}
