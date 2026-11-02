'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { copy } from '@/shared/copy';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';

/** 기본 양념은 있다고 보고 계산한다는 안내와 읽기 전용 목록. 기본은 접혀 있다 */
export function PantryBasics({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1">{copy.ingredients.pantryGuide}</p>
        <CollapsibleTrigger asChild>
          <Button variant="ghost">
            <ChevronDown aria-hidden="true" className={cn('transition-transform', open && 'rotate-180')} />
            {open ? copy.ingredients.pantryCollapse : copy.ingredients.pantryExpand(names.length)}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <p className="text-sm text-muted-foreground">{names.join(', ')}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}
