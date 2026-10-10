"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEEKDAY_NAMES } from "@/lib/labels";
import { isHoliday } from "@/lib/holidays";
import { cn } from "@/lib/utils";

function shiftSchoolDay(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  do d.setUTCDate(d.getUTCDate() + delta);
  while (isHoliday(d.toISOString().slice(0, 10)));
  return d.toISOString().slice(0, 10);
}

/** تنقّل بين الأيام (يتخطى الخميس والجمعة) مع حفظ باقي معاملات الرابط */
export function DateNav({
  date,
  today,
  keep,
}: {
  date: string;
  today: string;
  keep?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const href = (d: string) => {
    const sp = new URLSearchParams(Object.entries(keep ?? {}).filter((e): e is [string, string] => Boolean(e[1])));
    sp.set("date", d);
    return `${pathname}?${sp.toString()}`;
  };
  const next = shiftSchoolDay(date, 1);
  const weekday = WEEKDAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" asChild aria-label="اليوم السابق">
        <Link href={href(shiftSchoolDay(date, -1))}>
          <ChevronRight />
        </Link>
      </Button>
      <div className="flex items-center gap-2">
        <span className="min-w-16 text-center font-semibold">{date === today ? "اليوم" : weekday}</span>
        <Input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && router.push(href(e.target.value))}
          className="w-40"
          aria-label="التاريخ"
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        asChild
        aria-label="اليوم التالي"
        className={cn(next > today && "pointer-events-none opacity-40")}
      >
        <Link href={href(next)}>
          <ChevronLeft />
        </Link>
      </Button>
      {date !== today && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={href(today)}>العودة لليوم</Link>
        </Button>
      )}
    </div>
  );
}
