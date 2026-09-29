"use client";

import * as React from "react";
import { ATTENDANCE_STATUS_LABELS, DAY_MEMORIZATION_LABELS, SESSION_TYPE_LABELS, WEEKDAY_NAMES } from "@/lib/labels";
import type { ReportDay, DayMemorizationStatus } from "@/lib/actions/reports";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DayMemorizationStatus, { cell: string; dot: string; chip: string }> = {
  MEMORIZED: {
    cell: "bg-success/15 border-success/40 text-success hover:bg-success/25",
    dot: "bg-success",
    chip: "border-success/40 bg-success/10 text-success",
  },
  NOT_MEMORIZED: {
    cell: "bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/20",
    dot: "bg-destructive",
    chip: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  REVIEW: {
    cell: "bg-sky-500/10 border-sky-500/40 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300",
    dot: "bg-sky-500",
    chip: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  NOT_RECITED: {
    cell: "bg-warning/15 border-warning/50 text-amber-700 hover:bg-warning/25 dark:text-amber-300",
    dot: "bg-warning",
    chip: "border-warning/50 bg-warning/15 text-amber-700 dark:text-amber-300",
  },
};

const STATUS_ORDER: DayMemorizationStatus[] = ["MEMORIZED", "NOT_MEMORIZED", "REVIEW", "NOT_RECITED"];

// أعمدة التقويم من اليمين: السبت ثم الأحد إلى الأربعاء (الخميس والجمعة عطلة)
const COLUMN_WEEKDAYS = [6, 0, 1, 2, 3];

function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function buildWeeks(days: ReportDay[]): (ReportDay | null)[][] {
  const weeks: (ReportDay | null)[][] = [];
  let week: (ReportDay | null)[] = [];
  for (const day of days) {
    const col = COLUMN_WEEKDAYS.indexOf(weekday(day.date));
    if (col === -1) continue;
    if (week.length > col) {
      weeks.push(week);
      week = [];
    }
    while (week.length < col) week.push(null);
    week.push(day);
  }
  if (week.length) weeks.push(week);
  return weeks.map((w) => [...w, ...Array<null>(COLUMN_WEEKDAYS.length - w.length).fill(null)]);
}

export function StudentDays({ days }: { days: ReportDay[] }) {
  const [filter, setFilter] = React.useState<DayMemorizationStatus | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);

  const counts = React.useMemo(() => {
    const c = { MEMORIZED: 0, NOT_MEMORIZED: 0, REVIEW: 0, NOT_RECITED: 0 } as Record<DayMemorizationStatus, number>;
    for (const d of days) if (d.memorizationStatus) c[d.memorizationStatus]++;
    return c;
  }, [days]);

  const weeks = React.useMemo(() => buildWeeks(days), [days]);
  const selectedDay = days.find((d) => d.date === selected) ?? null;
  const listed = days.filter((d) => d.memorizationStatus && (!filter || d.memorizationStatus === filter)).reverse();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(filter === s ? null : s)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-all",
              STATUS_STYLES[s].chip,
              filter && filter !== s && "opacity-40",
              filter === s && "ring-2 ring-current/30"
            )}
          >
            <span className={cn("size-2 rounded-full", STATUS_STYLES[s].dot)} />
            {DAY_MEMORIZATION_LABELS[s]}
            <span className="rounded-full bg-background/70 px-1.5 text-xs tabular-nums">{counts[s]}</span>
          </button>
        ))}
        {filter && (
          <button type="button" onClick={() => setFilter(null)} className="no-print text-sm text-muted-foreground underline">
            إظهار الكل
          </button>
        )}
      </div>

      <div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {COLUMN_WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-center text-xs font-medium text-muted-foreground">
              {WEEKDAY_NAMES[w]}
            </div>
          ))}
          {weeks.flat().map((day, i) =>
            day ? (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelected(selected === day.date ? null : day.date)}
                title={day.memorizationStatus ? DAY_MEMORIZATION_LABELS[day.memorizationStatus] : undefined}
                className={cn(
                  "flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border text-sm transition-all sm:h-16",
                  day.memorizationStatus
                    ? STATUS_STYLES[day.memorizationStatus].cell
                    : "border-dashed bg-muted/40 text-muted-foreground",
                  filter && day.memorizationStatus !== filter && "opacity-25",
                  selected === day.date && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <span className="text-base font-semibold tabular-nums sm:text-lg">{Number(day.date.slice(8))}</span>
                <span className="truncate text-[10px] leading-none sm:text-[11px]">
                  {day.memorizationStatus ? DAY_MEMORIZATION_LABELS[day.memorizationStatus] : ""}
                </span>
              </button>
            ) : (
              <div key={`empty-${i}`} />
            )
          )}
        </div>
      </div>

      {selectedDay && (
        <div className="no-print animate-in fade-in slide-in-from-top-1 rounded-lg border bg-muted/30 p-4">
          <DayDetails day={selectedDay} />
        </div>
      )}

      <div>
        <h3 className="mb-3 font-semibold">السجل اليومي</h3>
        <ol className="relative flex flex-col gap-2 border-s ps-5">
          {listed.map((day) => (
            <li key={day.date} className="relative">
              <span
                className={cn(
                  "absolute -start-[1.6rem] top-3 size-2.5 rounded-full ring-4 ring-background",
                  STATUS_STYLES[day.memorizationStatus!].dot
                )}
              />
              <div className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30">
                <DayDetails day={day} />
              </div>
            </li>
          ))}
          {listed.length === 0 && <li className="text-sm text-muted-foreground">لا توجد أيام بهذه الحالة</li>}
        </ol>
      </div>
    </div>
  );
}

function DayDetails({ day }: { day: ReportDay }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {WEEKDAY_NAMES[weekday(day.date)]} {day.date}
        </span>
        {day.memorizationStatus && (
          <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_STYLES[day.memorizationStatus].chip)}>
            {DAY_MEMORIZATION_LABELS[day.memorizationStatus]}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          الحضور: {day.attendanceStatus ? ATTENDANCE_STATUS_LABELS[day.attendanceStatus] : day.hasRecord ? "—" : "غير مسجّل"}
        </span>
      </div>
      {day.memorization.length > 0 ? (
        <ul className="text-sm text-muted-foreground">
          {day.memorization.map((m, i) => (
            <li key={i}>
              <span className="font-medium text-foreground">{SESSION_TYPE_LABELS[m.sessionType]}:</span> {m.summary}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">لا توجد جلسات مسجلة</p>
      )}
    </div>
  );
}
