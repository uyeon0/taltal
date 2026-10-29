"use client";

import { useEffect, useState } from "react";

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { num } from "@/lib/amount";
import type { Meal, Recipe } from "@/logic/types";
import type { RecipeDetail } from "@/server/data";

type Target = { meal: Meal; recipe: Recipe } | null;

export function RecipeSheet({ target, onClose }: { target: Target; onClose: () => void }) {
  const [detail, setDetail] = useState<{ id: number; data: RecipeDetail | null } | null>(null);
  const id = target?.recipe.id;

  useEffect(() => {
    if (id === undefined) return;
    let alive = true;
    fetch(`/api/recipes/${id}`)
      .then((res) => (res.ok ? (res.json() as Promise<RecipeDetail>) : null))
      .catch(() => null)
      .then((data) => alive && setDetail({ id, data }));
    return () => {
      alive = false;
    };
  }, [id]);

  const loaded = detail && detail.id === id ? detail : null;

  return (
    <Drawer open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="mx-auto max-h-[85dvh] max-w-md">
        {target && (
          <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-8">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle className="text-xl">{target.recipe.name}</DrawerTitle>
              <DrawerDescription>
                {target.recipe.cookingTime} · {target.recipe.level}
              </DrawerDescription>
            </DrawerHeader>

            {loaded?.data?.summary && <p className="text-muted-foreground">{loaded.data.summary}</p>}

            <section className="flex flex-col gap-2">
              <h3 className="font-semibold">이 요리에 쓰는 재료</h3>
              <ul className="flex flex-col gap-1 text-sm">
                {target.recipe.ingredients.map((ri) => {
                  const use = target.meal.uses.find((u) => u.ingredientId === ri.ingredientId);
                  return (
                    <li key={ri.ingredientId} className="flex justify-between">
                      <span>{ri.ingredientId}</span>
                      <span className="text-muted-foreground">
                        {use ? `${num(use.grams)}g · ` : ""}원문 {ri.amountText}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-muted-foreground">원문 분량은 {target.recipe.servingsOriginal}인분 기준이에요.</p>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="font-semibold">만드는 법</h3>
              {!loaded && (
                <div className="flex flex-col gap-2" aria-busy="true">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-5 w-3/5" />
                </div>
              )}
              {loaded && !loaded.data && <p className="text-sm text-muted-foreground">조리 과정을 불러오지 못했어요.</p>}
              {loaded?.data && (
                <ol className="flex flex-col gap-3">
                  {loaded.data.steps.map((s) => (
                    <li key={s.no} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{s.no}</span>
                      <div className="flex flex-col gap-1">
                        <p>{s.text}</p>
                        {s.tip && <p className="text-sm text-muted-foreground">팁: {s.tip}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
