"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { ALL_PORTIONS, portionsForSurah, type PortionOption } from "@/lib/quran/athman";
import { SURAHS } from "@/lib/quran/surahs";
import { normalizeArabic } from "@/lib/search";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 60;

const surahName = (n: number) => SURAHS.find((s) => s.number === n)?.nameArabic ?? "";

const SEARCH_INDEX = ALL_PORTIONS.map((p) => ({
  option: p,
  haystack: normalizeArabic(`${p.text} ${surahName(p.surahNumber)}`),
}));

export function ThumnPicker({
  surahNumber,
  selected,
  onSelect,
}: {
  surahNumber: number;
  selected: PortionOption | null;
  onSelect: (option: PortionOption) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const q = normalizeArabic(query);
  const results = React.useMemo(() => {
    if (!q) return portionsForSurah(surahNumber);
    const asNumber = Number(q);
    return SEARCH_INDEX.filter(
      ({ option, haystack }) => haystack.includes(q) || (Number.isInteger(asNumber) && option.thumn === asNumber)
    )
      .slice(0, MAX_RESULTS)
      .map((r) => r.option);
  }, [q, surahNumber]);

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

  function openPicker() {
    setQuery("");
    const idx = selected ? portionsForSurah(surahNumber).findIndex((p) => p.key === selected.key) : -1;
    setActive(Math.max(idx, 0));
    setOpen(true);
  }

  function choose(option: PortionOption) {
    onSelect(option);
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
    <div ref={rootRef} className="relative" data-picker>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-start text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.text : "ابحث أو اختر ثمناً"}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-1 flex w-[min(24rem,85vw)] flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95">
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
              placeholder="اكتب كلمة من المطلع أو اسم السورة أو رقم الثمن"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="border-b bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            {q ? `نتائج البحث في كل الأثمان (${results.length})` : `أثمان سورة ${surahName(surahNumber)} (${results.length})`}
          </p>
          <ul ref={listRef} className="max-h-64 overflow-y-auto p-1">
            {results.map((option, i) => (
              <li key={option.key} data-index={i}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-start text-sm",
                    i === active && "bg-accent text-accent-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                      option.thumn ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {option.thumn ? `ثمن ${option.thumn}` : "بداية"}
                  </span>
                  <span className="flex-1">
                    {option.text}
                    <span className="ms-1 text-xs text-muted-foreground">
                      ({surahName(option.surahNumber)}: {option.ayah})
                    </span>
                  </span>
                  {selected?.key === option.key && <Check className="mt-0.5 size-4 shrink-0 text-primary" />}
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">لا توجد نتائج</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
