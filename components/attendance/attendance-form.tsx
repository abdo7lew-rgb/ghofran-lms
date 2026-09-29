"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";
import { Input } from "@/components/ui/input";
import { saveAttendanceAction, type AttendanceStatus, type SaveAttendanceState } from "@/lib/actions/attendance";
import { Button } from "@/components/ui/button";

type StudentRow = { id: number; fullName: string; status: AttendanceStatus };

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  { value: "PRESENT", label: "حاضر", activeClass: "bg-success text-success-foreground" },
  { value: "LATE", label: "متأخر", activeClass: "bg-warning text-warning-foreground" },
  { value: "EXCUSED", label: "بإذن", activeClass: "bg-secondary text-secondary-foreground" },
  { value: "ABSENT", label: "غائب", activeClass: "bg-destructive text-destructive-foreground" },
];

const initialState: SaveAttendanceState = {};

function StudentStatusRow({
  student,
  value,
  onChange,
  hidden,
}: {
  student: StudentRow;
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  hidden: boolean;
}) {
  // الصف المخفي بالبحث يبقى داخل النموذج حتى يُحفظ حضور كل الطلبة
  return (
    <div hidden={hidden} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
      <span className="font-medium">{student.fullName}</span>
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              value === opt.value ? opt.activeClass : "bg-background hover:bg-accent"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input type="hidden" name={`status_${student.id}`} value={value} />
    </div>
  );
}

export function AttendanceForm({
  circleId,
  date,
  students,
}: {
  circleId: number;
  date: string;
  students: StudentRow[];
}) {
  const [statuses, setStatuses] = React.useState<Record<number, AttendanceStatus>>(
    Object.fromEntries(students.map((s) => [s.id, s.status]))
  );
  const [state, formAction, pending] = useActionState(saveAttendanceAction, initialState);
  const [query, setQuery] = React.useState("");
  const visibleCount = students.filter((s) => matchesSearch(s.fullName, query)).length;

  function setAll(status: AttendanceStatus) {
    setStatuses(Object.fromEntries(students.map((s) => [s.id, status])));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="date" value={date} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">تحديد سريع للجميع:</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAll(opt.value)}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              الكل {opt.label}
            </button>
          ))}
        </div>
      </div>

      {students.length > 8 && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="ابحث عن طالب في الحلقة..."
            className="ps-8"
          />
        </div>
      )}

      <div className="rounded-lg border px-4">
        {students.map((student) => (
          <StudentStatusRow
            key={student.id}
            student={student}
            value={statuses[student.id]}
            onChange={(status) => setStatuses((prev) => ({ ...prev, [student.id]: status }))}
            hidden={!matchesSearch(student.fullName, query)}
          />
        ))}
        {visibleCount === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا يوجد طالب بهذا الاسم</p>}
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-success">تم حفظ الحضور بنجاح</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending && <Loader2 className="animate-spin" />}
        حفظ الحضور
      </Button>
    </form>
  );
}
