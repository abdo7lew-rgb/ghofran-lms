"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownUp, ChevronLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MEMORIZATION_GRADE_MAX } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Row = { studentId: number; fullName: string; grade: number | null; attendanceRate: number | null };
type SortKey = "name" | "grade" | "attendance";

function barTone(ratio: number) {
  return ratio >= 0.75 ? "bg-success" : ratio >= 0.5 ? "bg-warning" : "bg-destructive";
}

function Bar({ value, max, label }: { value: number | null; max: number; label: string }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const ratio = Math.min(value / max, 1);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", barTone(ratio))} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="text-sm tabular-nums">{label}</span>
    </div>
  );
}

export function CircleStudentsTable({ rows, showGrade, periodQuery }: { rows: Row[]; showGrade: boolean; periodQuery: string }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; desc: boolean }>({
    key: showGrade ? "grade" : "attendance",
    desc: true,
  });

  const visible = React.useMemo(() => {
    const filtered = rows.filter((r) => r.fullName.includes(query.trim()));
    const val = (r: Row) => (sort.key === "grade" ? r.grade : sort.key === "attendance" ? r.attendanceRate : null) ?? -1;
    return filtered.sort((a, b) => {
      const cmp = sort.key === "name" ? a.fullName.localeCompare(b.fullName, "ar") : val(a) - val(b);
      return sort.desc ? -cmp : cmp;
    });
  }, [rows, query, sort]);

  const header = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "name" }))}
      className={cn("inline-flex items-center gap-1 font-medium", sort.key === key ? "text-foreground" : "text-muted-foreground")}
    >
      {label}
      <ArrowDownUp className="no-print size-3.5" />
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="no-print relative w-full max-w-xs">
        <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن طالب..." className="ps-8" />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-start">
            <tr>
              <th className="w-10 p-3 text-start text-muted-foreground">#</th>
              <th className="p-3 text-start">{header("name", "الطالب")}</th>
              {showGrade && <th className="p-3 text-start">{header("grade", `درجة الحفظ (من ${MEMORIZATION_GRADE_MAX})`)}</th>}
              <th className="p-3 text-start">{header("attendance", "نسبة الحضور")}</th>
              <th className="no-print w-8" />
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={r.studentId} className="group border-t transition-colors hover:bg-muted/40">
                <td className="p-3 tabular-nums text-muted-foreground">{i + 1}</td>
                <td className="p-3 font-medium">
                  <Link href={`/reports?type=student&targetId=${r.studentId}&${periodQuery}`} className="hover:text-primary hover:underline">
                    {r.fullName}
                  </Link>
                </td>
                {showGrade && (
                  <td className="p-3">
                    <Bar value={r.grade} max={MEMORIZATION_GRADE_MAX} label={r.grade === null ? "—" : `${r.grade}`} />
                  </td>
                )}
                <td className="p-3">
                  <Bar value={r.attendanceRate} max={100} label={r.attendanceRate === null ? "—" : `${r.attendanceRate}%`} />
                </td>
                <td className="no-print p-3">
                  <Link href={`/reports?type=student&targetId=${r.studentId}&${periodQuery}`} aria-label={`تقرير ${r.fullName}`}>
                    <ChevronLeft className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  لا يوجد طالب بهذا الاسم
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
