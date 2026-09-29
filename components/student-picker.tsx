"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { matchesSearch } from "@/lib/search";
import { compareCircleNames } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type StudentPickerOption = { id: number; name: string; circleName: string };

/** اختيار طالب بالبحث بالاسم، مع تصفية سريعة حسب الحلقة */
export function StudentPicker({
  students,
  value,
  onChange,
  placeholder = "اختر الطالب...",
  className,
}: {
  students: StudentPickerOption[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [circle, setCircle] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const selected = students.find((s) => String(s.id) === value) ?? null;
  const circleNames = React.useMemo(
    () => [...new Set(students.map((s) => s.circleName))].filter(Boolean).sort(compareCircleNames),
    [students]
  );

  const results = React.useMemo(
    () => students.filter((s) => (!circle || s.circleName === circle) && matchesSearch(s.name, query)),
    [students, circle, query]
  );

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(s: StudentPickerOption) {
    onChange(String(s.id));
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)} data-picker>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setActive(0);
          setOpen((o) => !o);
        }}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-start text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? (
            <>
              {selected.name}
              {selected.circleName && <span className="text-muted-foreground"> — {selected.circleName}</span>}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 flex w-full min-w-72 flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="اكتب اسم الطالب..."
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {circleNames.length > 1 && (
            <div className="flex flex-wrap gap-1 border-b p-2">
              {[null, ...circleNames].map((c) => (
                <button
                  key={c ?? "all"}
                  type="button"
                  onClick={() => {
                    setCircle(c);
                    setActive(0);
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                    circle === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  {c ?? "كل الحلقات"}
                </button>
              ))}
            </div>
          )}

          <ul ref={listRef} className="max-h-64 overflow-y-auto p-1">
            {results.map((s, i) => (
              <li key={s.id} data-index={i}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(s)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-start text-sm",
                    i === active && "bg-accent text-accent-foreground"
                  )}
                >
                  <span>
                    {s.name}
                    {!circle && s.circleName && (
                      <span className="ms-1 text-xs text-muted-foreground">— {s.circleName}</span>
                    )}
                  </span>
                  {selected?.id === s.id && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">لا يوجد طالب بهذا الاسم</li>}
          </ul>
          <p className="border-t bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground">{results.length} طالب</p>
        </div>
      )}
    </div>
  );
}
