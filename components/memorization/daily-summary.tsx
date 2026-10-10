"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { DailySummaryRow, DayMemorizationStatus } from "@/lib/actions/reports";
import { ATTENDANCE_STATUS_LABELS, DAY_MEMORIZATION_LABELS, SESSION_TYPE_LABELS } from "@/lib/labels";
import { STATUS_ORDER, STATUS_STYLES } from "@/components/reports/student-days";
import { MemorizationDialog } from "@/components/memorization/memorization-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DailySummary({ rows, date, showCircle }: { rows: DailySummaryRow[]; date: string; showCircle: boolean }) {
  const [filter, setFilter] = React.useState<DayMemorizationStatus | null>(null);

  const counts = React.useMemo(() => {
    const c = { MEMORIZED: 0, NOT_MEMORIZED: 0, REVIEW: 0, NOT_RECITED: 0 } as Record<DayMemorizationStatus, number>;
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const recited = rows.length - counts.NOT_RECITED;
  const visible = filter ? rows.filter((r) => r.status === filter) : rows;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">
            سمّع {recited} من {rows.length} طالب
          </span>
          <span className="text-muted-foreground">{rows.length ? Math.round((recited / rows.length) * 100) : 0}%</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {STATUS_ORDER.filter((s) => s !== "NOT_RECITED").map((s) => (
            <div
              key={s}
              className={cn("h-full transition-all", STATUS_STYLES[s].dot)}
              style={{ width: `${rows.length ? (counts[s] / rows.length) * 100 : 0}%` }}
            />
          ))}
        </div>
      </div>

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
          <button type="button" onClick={() => setFilter(null)} className="text-sm text-muted-foreground underline">
            إظهار الكل
          </button>
        )}
      </div>

      <ul className="divide-y rounded-lg border">
        {visible.map((r) => (
          <li key={r.studentId} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5">
            <span className={cn("size-2.5 shrink-0 rounded-full", STATUS_STYLES[r.status].dot)} />
            <div className="flex min-w-[9rem] flex-1 flex-col">
              <Link href={`/students/${r.studentId}`} className="font-medium hover:underline">
                {r.fullName}
              </Link>
              <span className="text-xs text-muted-foreground">
                {showCircle && `${r.circleName} · `}
                الحضور: {r.attendanceStatus ? ATTENDANCE_STATUS_LABELS[r.attendanceStatus] : "غير مسجّل"}
                {r.sessions.length > 0 &&
                  ` · ${r.sessions.map((s) => `${SESSION_TYPE_LABELS[s.sessionType]}: ${s.summary}`).join(" — ")}`}
              </span>
            </div>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[r.status].chip)}>
              {DAY_MEMORIZATION_LABELS[r.status]}
            </span>
            <MemorizationDialog
              students={[{ id: r.studentId, fullName: r.fullName, circleName: r.circleName }]}
              defaultStudentId={r.studentId}
              defaultDate={date}
              trigger={
                <Button
                  variant={r.status === "NOT_RECITED" ? "default" : "ghost"}
                  size="sm"
                  aria-label={`تسجيل جلسة لـ ${r.fullName}`}
                >
                  <Plus />
                  تسجيل
                </Button>
              }
            />
          </li>
        ))}
        {visible.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "لا يوجد طلبة في هذا اليوم" : "لا يوجد طلبة بهذه الحالة"}
          </li>
        )}
      </ul>
    </div>
  );
}
