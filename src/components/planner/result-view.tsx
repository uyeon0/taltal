"use client";

import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useState } from "react";

import type { Comparison, Mode, Option, Outcome } from "@/components/planner/planner";
import { RecipeSheet } from "@/components/planner/recipe-sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { inUnit, num, shoppingAmount } from "@/lib/amount";
import type { Ingredient, Leftover, Meal, Recipe, Result } from "@/logic/types";

type Props = {
  outcome: Outcome;
  servings: number;
  byId: Map<string, Ingredient>;
  onBack: () => void;
  onRetry: () => void;
};

// "약간"으로만 쓰는 고명(optional)은 없어도 되므로 장보기 수에서 뺀다
const mustBuy = (result: Result) => result.shoppingList.filter((s) => !s.optional);
const niceToHave = (result: Result) => result.shoppingList.filter((s) => s.optional);

// 1g 아래로 남으면 다 쓴 것으로 본다 (사용량은 0.1g 단위로 반올림돼 온다)
const isUsedUp = (l: Leftover) => l.leftGrams < 1;

/** 받침이 있으면 "은", 없으면 "는" */
const topic = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code < 11172 && code % 28 !== 0 ? "은" : "는";
};

export function ResultView({ outcome, servings, byId, onBack, onRetry }: Props) {
  const [open, setOpen] = useState<{ meal: Meal; recipe: Recipe } | null>(null);
  const empty = outcome.state === "done" && outcome.modes.noBuy.options.length === 0 && outcome.modes.buy.options.length === 0;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-2 py-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft />
          다시 고르기
        </Button>
        <span className="pr-3 text-sm text-muted-foreground">한 번에 {servings}인분</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        {outcome.state === "loading" && <Loading />}

        {outcome.state === "error" && (
          <Alert variant="destructive">
            <AlertTitle>추천을 불러오지 못했어요</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
              잠시 뒤에 다시 시도해 주세요.
              <Button variant="outline" size="sm" onClick={onRetry}>
                다시 시도
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {empty && (
          <Alert>
            <AlertTitle>이 재료로 만들 수 있는 요리를 찾지 못했어요</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
              대파·양파처럼 자주 쓰는 재료를 더 넣어 보세요.
              <Button variant="outline" size="sm" onClick={onBack}>
                다시 고르기
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {outcome.state === "done" && !empty && (
          <Modes
            modes={outcome.modes}
            candidates={outcome.candidates}
            inventory={outcome.inventory}
            servings={servings}
            byId={byId}
            onOpen={(meal) => setOpen({ meal, recipe: outcome.candidates.find((r) => r.id === meal.recipeId)! })}
          />
        )}
      </main>

      <RecipeSheet target={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="요리 조합을 찾는 중">
      <p className="text-center text-muted-foreground">가진 재료로 요리 조합을 맞춰 보는 중이에요…</p>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

type ModesProps = Omit<DoneProps, "mode" | "options" | "best"> & { modes: Record<Mode, Comparison> };

/**
 * 사지 않고 만들 수 있는 조합을 먼저 보여 준다. 설문에서 문제는 추가 구매보다 사 둔 재료가 버려지는 것이었다.
 * 조금 사서 더 다 쓰는 조합은 아래 카드로 따로 권한다.
 */
function Modes({ modes, ...rest }: ModesProps) {
  const canSkipBuying = modes.noBuy.options.length > 0;
  const [mode, setMode] = useState<Mode>(canSkipBuying ? "noBuy" : "buy");
  const buyTop = modes.buy.options[modes.buy.best];

  return (
    <>
      {mode === "buy" && canSkipBuying && (
        <Button variant="link" className="self-start px-0" onClick={() => setMode("noBuy")}>
          <ChevronLeft />
          사지 않는 조합 보기
        </Button>
      )}
      {mode === "buy" && !canSkipBuying && (
        <Alert>
          <AlertDescription>가진 재료만으로 만들 수 있는 요리가 없어서, 조금 사는 조합을 보여 드려요.</AlertDescription>
        </Alert>
      )}

      <Done key={mode} mode={mode} options={modes[mode].options} best={modes[mode].best} {...rest} />

      {mode === "noBuy" && buyTop && (
        <button type="button" onClick={() => setMode("buy")} className="text-left">
          <Card className="border-dashed transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-3">
              <ShoppingCart className="size-5 shrink-0 text-muted-foreground" />
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="font-semibold">조금 사면 더 다 쓸 수 있어요</p>
                <p className="text-sm text-muted-foreground">
                  {mustBuy(buyTop.result).length > 0 && `${mustBuy(buyTop.result).map((s) => s.ingredientId).join("·")}를 조금 사면 `}
                  {buyTop.dishes}가지 요리 · 다 쓰는 재료 {buyTop.result.leftovers.filter(isUsedUp).length}개
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </button>
      )}
    </>
  );
}

type DoneProps = {
  mode: Mode;
  options: Option[];
  best: number;
  candidates: Recipe[];
  inventory: { id: string; unit: string }[];
  servings: number;
  byId: Map<string, Ingredient>;
  onOpen: (meal: Meal) => void;
};

function Done({ mode, options, best, candidates, inventory, servings, byId, onOpen }: DoneProps) {
  const [selected, setSelected] = useState(best);
  const { result, dishes } = options[selected];
  const unitOf = new Map(inventory.map((it) => [it.id, it.unit]));
  const optional = new Set(niceToHave(result).map((s) => s.ingredientId));
  // 사용자가 입력한 단위로 보여 준다. 예: 두부 300g → 1모
  const amount = (id: string, grams: number) => inUnit(byId.get(id)!, grams, unitOf.get(id) ?? "g");

  const usedUp = result.leftovers.filter(isUsedUp);
  const remaining = result.leftovers.filter((l) => !isUsedUp(l)).sort((a, b) => b.leftGrams / b.startGrams - a.leftGrams / a.startGrams);
  const usedUpNames = usedUp.map((l) => l.ingredientId).join("·");

  return (
    <>
      <section className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">
          {mode === "noBuy" ? `사지 않고 ${dishes}가지 요리를 만들 수 있어요` : `조금 사면 ${dishes}가지 요리를 만들 수 있어요`}
        </h1>
        {options.length > 1 && (
          <ToggleGroup type="single" variant="outline" value={String(selected)} onValueChange={(v) => v && setSelected(Number(v))} className="w-full">
            {options.map((o, i) => (
              <ToggleGroupItem
                key={o.dishes}
                value={String(i)}
                className="h-auto flex-1 flex-col gap-0.5 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <span className="font-semibold">{o.dishes}가지</span>
                <span className="text-xs opacity-80">다 쓰는 재료 {o.result.leftovers.filter(isUsedUp).length}개</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </section>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex flex-col gap-1">
          <p className="text-lg font-bold">
            {usedUp.length === 0 ? "다 쓰는 재료는 아직 없어요" : remaining.length === 0 ? "가진 재료를 다 써요" : `${usedUpNames}${topic(usedUpNames)} 다 써요`}
          </p>
          {remaining.length > 0 && (
            <p className="text-sm opacity-80">남는 재료: {remaining.map((l) => `${l.ingredientId} ${amount(l.ingredientId, l.leftGrams)}`).join(" · ")}</p>
          )}
          {mustBuy(result).length > 0 && <p className="text-sm opacity-80">장보기 {mustBuy(result).length}가지 · 조금씩</p>}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">재료별로 보면</h2>
        <ul className="flex flex-col gap-3 rounded-lg border px-4 py-3">
          {[...remaining, ...usedUp].map((l) => (
            <li key={l.ingredientId} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{l.ingredientId}</span>
                <span className="text-muted-foreground">{isUsedUp(l) ? "다 써요" : `${amount(l.ingredientId, l.leftGrams)} 남음`}</span>
              </div>
              <Progress value={((l.startGrams - l.leftGrams) / l.startGrams) * 100} aria-label={`${l.ingredientId} 쓰는 비율`} />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">요리</h2>
        {result.meals.map((meal, i) => {
          const recipe = candidates.find((r) => r.id === meal.recipeId);
          const own = meal.uses.filter((u) => !meal.toBuy.includes(u.ingredientId));
          const buy = meal.toBuy.filter((id) => !optional.has(id));
          const nice = meal.toBuy.filter((id) => optional.has(id));
          return (
            <button key={meal.recipeId} type="button" onClick={() => onOpen(meal)} className="text-left">
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">요리 {i + 1}</Badge>
                    <span className="flex-1 font-semibold">{meal.name}</span>
                    {recipe && <span className="text-sm text-muted-foreground">{recipe.cookingTime}</span>}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                  {own.length > 0 && (
                    <p className="text-sm text-muted-foreground">{own.map((u) => `${u.ingredientId} ${amount(u.ingredientId, u.grams)}`).join(" · ")}</p>
                  )}
                  {buy.length > 0 && (
                    <p className="flex items-center gap-1 text-sm">
                      <ShoppingCart className="size-4" />
                      {buy.join(", ")} 사야 해요
                    </p>
                  )}
                  {nice.length > 0 && <p className="text-sm text-muted-foreground">있으면 좋음: {nice.join(", ")}</p>}
                  {meal.pantryNeeded.length > 0 && <p className="text-sm text-muted-foreground">필요한 양념: {meal.pantryNeeded.join(", ")}</p>}
                </CardContent>
              </Card>
            </button>
          );
        })}
      </section>

      {mustBuy(result).length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">장보기</h2>
          <ul className="flex flex-col gap-1 rounded-lg border px-4 py-3">
            {mustBuy(result).map((s) => (
              <li key={s.ingredientId} className="flex justify-between">
                <span>{s.ingredientId}</span>
                <span className="text-muted-foreground">{byId.has(s.ingredientId) ? shoppingAmount(byId.get(s.ingredientId)!, s.grams) : `${num(s.grams)}g`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {niceToHave(result).length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">있으면 좋음</h2>
          <p className="text-sm text-muted-foreground">고명처럼 조금 들어가는 재료예요. 없어도 만들 수 있어요.</p>
          <p className="text-sm">{niceToHave(result).map((s) => s.ingredientId).join(", ")}</p>
        </section>
      )}

      <p className="text-center text-xs text-muted-foreground">
        한 번에 {servings}인분 기준이에요. 재료 무게는 추정치라 실제와 다를 수 있어요.
      </p>
    </>
  );
}
