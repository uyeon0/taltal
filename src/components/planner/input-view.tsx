"use client";

import { ChevronDown, Minus, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { Item } from "@/components/planner/planner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { defaultQty } from "@/lib/amount";
import type { Ingredient } from "@/logic/types";

// 레시피에 많이 나오는 순서 (ui-flow.md). 데이터에 없는 재료는 칩에서 빠진다.
const CHIPS = ["대파", "쇠고기", "양파", "홍고추", "계란", "돼지고기", "당근", "두부", "표고버섯", "김치"];

type Props = {
  ingredients: Ingredient[];
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  servings: number;
  onServingsChange: (servings: number) => void;
  onSubmit: () => void;
};

export function InputView({ ingredients, items, onItemsChange, servings, onServingsChange, onSubmit }: Props) {
  const [query, setQuery] = useState("");
  const foods = useMemo(() => ingredients.filter((i) => !i.pantry), [ingredients]);
  const byId = useMemo(() => new Map(foods.map((i) => [i.id, i])), [foods]);
  const basics = ingredients.filter((i) => i.pantry === "기본").map((i) => i.id);
  const chips = CHIPS.filter((id) => byId.has(id));

  const q = query.trim();
  const matches = q ? foods.filter((i) => i.id.includes(q) || i.aliases.some((a) => a.includes(q))).slice(0, 8) : [];

  function add(id: string) {
    const existing = items.find((it) => it.id === id);
    if (existing) {
      const step = existing.unit === "g" ? 100 : 1;
      onItemsChange(items.map((it) => (it.id === id ? { ...it, qty: it.qty + step } : it)));
    } else {
      onItemsChange([...items, { id, ...defaultQty(byId.get(id)!) }]);
    }
    setQuery("");
  }

  const update = (id: string, patch: Partial<Item>) => onItemsChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: string) => onItemsChange(items.filter((it) => it.id !== id));

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col gap-6 px-5 pt-8 pb-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">냉장고에 뭐가 있나요?</h1>
          <p className="text-muted-foreground">재료와 양을 넣으면 남김없이 쓰는 요리 조합을 찾아 드려요.</p>
        </header>

        <section className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="재료 이름 검색"
              className="h-11 pl-9"
              aria-label="재료 이름 검색"
            />
            {q && (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border bg-popover shadow-md">
                {matches.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-muted-foreground">아직 다루지 않는 재료예요.</li>
                ) : (
                  matches.map((i) => (
                    <li key={i.id}>
                      <button type="button" onClick={() => add(i.id)} className="w-full px-4 py-3 text-left hover:bg-accent">
                        {i.id}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">자주 쓰는 재료</p>
            <div className="flex flex-wrap gap-2">
              {chips.map((id) => (
                <Button key={id} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => add(id)}>
                  {id}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            담은 재료 <Badge variant="secondary">{items.length}</Badge>
          </h2>
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              위에서 재료를 골라 담아 주세요.
            </p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {items.map((it) => (
                <ItemRow key={it.id} item={it} ingredient={byId.get(it.id)!} onChange={(p) => update(it.id, p)} onRemove={() => remove(it.id)} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <Stepper label="한 번에" values={[1, 2, 3, 4]} unit="인분" value={servings} onChange={onServingsChange} />
        </section>

        <Collapsible className="rounded-lg bg-muted px-4 py-3 text-sm">
          <CollapsibleTrigger className="flex w-full items-center justify-between text-left text-muted-foreground">
            소금·간장 같은 기본 양념은 집에 있다고 보고 계산해요
            <ChevronDown className="size-4 shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 text-muted-foreground">{basics.join(", ")}</CollapsibleContent>
        </Collapsible>
      </main>

      <div className="sticky bottom-0 border-t bg-background px-5 py-3">
        <Button className="h-12 w-full text-base" disabled={items.length === 0} onClick={onSubmit}>
          요리 조합 찾기
        </Button>
      </div>
    </div>
  );
}

function ItemRow({ item, ingredient, onChange, onRemove }: { item: Item; ingredient: Ingredient; onChange: (patch: Partial<Item>) => void; onRemove: () => void }) {
  const step = item.unit === "g" ? 50 : 0.5;
  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-medium">{item.id}</span>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`${item.id} 줄이기`} onClick={() => onChange({ qty: Math.max(step, item.qty - step) })}>
        <Minus />
      </Button>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={item.qty}
        onChange={(e) => onChange({ qty: Number(e.target.value) })}
        className="h-8 w-16 text-center"
        aria-label={`${item.id} 수량`}
      />
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`${item.id} 늘리기`} onClick={() => onChange({ qty: item.qty + step })}>
        <Plus />
      </Button>
      <Select
        value={item.unit}
        onValueChange={(unit) => onChange(unit === "g" ? { unit, qty: Math.round(item.qty * ingredient.unitGrams[item.unit]) } : { unit, qty: 1 })}
      >
        <SelectTrigger size="sm" className="w-18" aria-label={`${item.id} 단위`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ingredient.inputUnits.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`${item.id} 빼기`} onClick={onRemove}>
        <X />
      </Button>
    </li>
  );
}

function Stepper({ label, values, unit, value, onChange }: { label: string; values: number[]; unit: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold">{label}</span>
      <ToggleGroup type="single" variant="outline" value={String(value)} onValueChange={(v) => v && onChange(Number(v))}>
        {values.map((v) => (
          <ToggleGroupItem key={v} value={String(v)} className="min-w-14 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            {v}
            {unit}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
