"use client";

import { useMemo, useState } from "react";

import { InputView } from "@/components/planner/input-view";
import { ResultView } from "@/components/planner/result-view";
import { toGrams } from "@/lib/amount";
import { recommend } from "@/logic/recommend";
import type { Ingredient, Recipe, Result, Stock } from "@/logic/types";

export type Item = { id: string; qty: number; unit: string };

// 요리 가짓수는 사용자가 고르지 않고 3·4·5가지를 모두 계산해 비교해 보여 준다
const DISH_COUNTS = [3, 4, 5];

export type Option = { dishes: number; result: Result };
export type Comparison = { options: Option[]; best: number };

// 결과는 두 가지로 나눠 보여 준다. 사지 않고 만들 수 있는 조합과, 조금 사서 더 다 쓰는 조합
export type Mode = "noBuy" | "buy";
const MAX_PURCHASES_BY_MODE: Record<Mode, number | undefined> = { noBuy: 0, buy: undefined };

export type Outcome =
  | { state: "loading" }
  | { state: "error" }
  | { state: "done"; modes: Record<Mode, Comparison>; candidates: Recipe[]; inventory: Item[] };

/**
 * 가짓수별 결과 중 보여 줄 것을 고른다. 요리를 더 해도 남는 비율이 줄지 않는 결과는 숨긴다.
 * 구매 3가지 한도 때문에 가짓수를 늘리면 덜 쓰는 조합이 나올 수 있어서다 (레인 A, 10/29).
 * 남은 결과는 가짓수가 늘수록 덜 남으므로 마지막 것이 가장 덜 남는다.
 */
function compare(results: Option[]): Comparison {
  const options: Option[] = [];
  for (const o of results) {
    if (o.result.status === "empty") continue;
    const prev = options.at(-1);
    // 5가지를 요청해도 4가지만 찾으면 4가지 결과와 같으므로 뺀다
    if (prev && (prev.dishes >= o.result.meals.length || prev.result.leftoverRatio <= o.result.leftoverRatio)) continue;
    options.push({ dishes: o.result.meals.length, result: o.result });
  }
  return { options, best: options.length - 1 };
}

export function Planner({ ingredients }: { ingredients: Ingredient[] }) {
  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const [items, setItems] = useState<Item[]>([]);
  const [servings, setServings] = useState(2);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function run() {
    setOutcome({ state: "loading" });
    const inventory: Stock[] = items.map((it) => ({ ingredientId: it.id, grams: toGrams(byId.get(it.id)!, it.qty, it.unit) }));
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory, servings }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { candidates } = (await res.json()) as { candidates: Recipe[] };
      // 탐색이 길어질 때도 로딩 표시가 먼저 그려지도록 한 박자 쉰다
      await new Promise((r) => setTimeout(r, 0));
      const byMode = (mode: Mode) =>
        compare(
          DISH_COUNTS.map((dishes) => ({
            dishes,
            result: recommend(inventory, { meals: dishes, servings, maxPurchases: MAX_PURCHASES_BY_MODE[mode] }, { candidates, ingredients }),
          })),
        );
      setOutcome({ state: "done", modes: { noBuy: byMode("noBuy"), buy: byMode("buy") }, candidates, inventory: items });
    } catch {
      setOutcome({ state: "error" });
    }
  }

  if (outcome === null) {
    return <InputView ingredients={ingredients} items={items} onItemsChange={setItems} servings={servings} onServingsChange={setServings} onSubmit={run} />;
  }
  return <ResultView outcome={outcome} servings={servings} byId={byId} onBack={() => setOutcome(null)} onRetry={run} />;
}
