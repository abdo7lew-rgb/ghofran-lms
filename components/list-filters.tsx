"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compareCircleNames } from "@/lib/labels";

const ALL = "__ALL__";

/** شريط بحث بالاسم + فلتر بالحلقة، يحفظ القيم في رابط الصفحة (q و circle) ليُطبّقها الخادم */
export function ListFilters({
  circles,
  query,
  circleId,
  placeholder = "ابحث عن طالب بالاسم...",
  keep,
}: {
  circles: { id: number; name: string }[];
  query?: string;
  circleId?: string;
  placeholder?: string;
  /** معاملات أخرى في الرابط تبقى كما هي عند تغيير البحث أو الحلقة (مثل date) */
  keep?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = React.useState(query ?? "");
  const [pending, startTransition] = React.useTransition();
  const keepQuery = new URLSearchParams(
    Object.entries(keep ?? {}).filter((e): e is [string, string] => Boolean(e[1]))
  ).toString();

  const navigate = React.useCallback(
    (next: { q?: string; circle?: string }) => {
      const sp = new URLSearchParams(keepQuery);
      const q = next.q ?? text;
      const circle = next.circle ?? circleId;
      if (q.trim()) sp.set("q", q.trim());
      if (circle) sp.set("circle", circle);
      const qs = sp.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [text, circleId, pathname, router, keepQuery]
  );

  React.useEffect(() => {
    if (text === (query ?? "")) return;
    const t = setTimeout(() => navigate({ q: text }), 300);
    return () => clearTimeout(t);
  }, [text, query, navigate]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-sm">
        <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="px-8" />
        {pending ? (
          <Loader2 className="absolute end-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          text && (
            <button
              type="button"
              onClick={() => {
                setText("");
                navigate({ q: "" });
              }}
              aria-label="مسح البحث"
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </div>

      {circles.length > 1 && (
        <Select value={circleId ?? ALL} onValueChange={(v) => navigate({ circle: v === ALL ? "" : v })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الحلقات</SelectItem>
            {[...circles].sort((a, b) => compareCircleNames(a.name, b.name)).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
