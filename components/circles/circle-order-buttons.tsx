"use client";

import { useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moveCircleAction } from "@/lib/actions/circles";

/** زرّا تحريك الحلقة للأعلى/للأسفل في الترتيب. */
export function CircleOrderButtons({ id, isFirst, isLast }: { id: number; isFirst: boolean; isLast: boolean }) {
  const [pending, startTransition] = useTransition();

  const move = (direction: "up" | "down") => startTransition(() => moveCircleAction(id, direction));

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={pending || isFirst}
        onClick={() => move("up")}
        aria-label="تحريك للأعلى"
        title="تحريك للأعلى"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={pending || isLast}
        onClick={() => move("down")}
        aria-label="تحريك للأسفل"
        title="تحريك للأسفل"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
