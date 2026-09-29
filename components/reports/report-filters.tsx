"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, GraduationCap, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMonth, shiftMonth } from "@/lib/labels";
import { StudentPicker, type StudentPickerOption } from "@/components/student-picker";
import { cn } from "@/lib/utils";

type Option = { id: number; name: string };
type ReportType = "student" | "circle" | "teacher";

function reportUrl(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  return `/reports?${sp.toString()}`;
}

export function ReportFilters({
  type,
  targetId,
  month,
  from,
  to,
  currentMonth,
  students,
  circles,
  teachers,
}: {
  type: ReportType;
  targetId?: string;
  month?: string;
  from?: string;
  to?: string;
  currentMonth: string;
  students: StudentPickerOption[];
  circles: Option[];
  teachers: Option[];
}) {
  const router = useRouter();
  const [custom, setCustom] = React.useState(!month);
  const [customFrom, setCustomFrom] = React.useState(from ?? "");
  const [customTo, setCustomTo] = React.useState(to ?? "");

  const options = type === "student" ? students : type === "circle" ? circles : teachers;
  const period = custom ? { from, to } : { month: month ?? currentMonth };

  const types: { value: ReportType; label: string; icon: React.ReactNode }[] = [
    { value: "student", label: "طالب", icon: <User className="size-4" /> },
    { value: "circle", label: "حلقة", icon: <Users className="size-4" /> },
    ...(teachers.length ? [{ value: "teacher" as const, label: "مدرس", icon: <GraduationCap className="size-4" /> }] : []),
  ];

  const activeMonth = month ?? currentMonth;

  return (
    <div className="no-print flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-muted p-1">
          {types.map((t) => (
            <Link
              key={t.value}
              href={reportUrl({ type: t.value, ...period })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                type === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.icon}
              {t.label}
            </Link>
          ))}
        </div>

        {type === "student" ? (
          <StudentPicker
            className="w-72"
            students={students}
            value={targetId}
            onChange={(id) => router.push(reportUrl({ type, targetId: id, ...period }))}
            placeholder="ابحث عن الطالب..."
          />
        ) : (
          <Select
            value={targetId}
            onValueChange={(id) => router.push(reportUrl({ type, targetId: id, ...period }))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder={type === "circle" ? "اختر الحلقة..." : "اختر المدرس..."} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setCustom(false);
              router.push(reportUrl({ type, targetId, month: activeMonth }));
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              !custom ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="size-4" />
            شهري
          </button>
          <button
            type="button"
            onClick={() => setCustom(true)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              custom ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarRange className="size-4" />
            فترة مخصصة
          </button>
        </div>

        {!custom ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild aria-label="الشهر السابق">
              <Link href={reportUrl({ type, targetId, month: shiftMonth(activeMonth, -1) })}>
                <ChevronRight />
              </Link>
            </Button>
            <span className="min-w-32 text-center text-base font-semibold">{formatMonth(activeMonth)}</span>
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="الشهر التالي"
              className={cn(activeMonth >= currentMonth && "pointer-events-none opacity-40")}
            >
              <Link href={reportUrl({ type, targetId, month: shiftMonth(activeMonth, 1) })}>
                <ChevronLeft />
              </Link>
            </Button>
            {activeMonth !== currentMonth && (
              <Button variant="outline" size="sm" asChild>
                <Link href={reportUrl({ type, targetId, month: currentMonth })}>الشهر الحالي</Link>
              </Button>
            )}
          </div>
        ) : (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(reportUrl({ type, targetId, from: customFrom, to: customTo }));
            }}
          >
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-40" aria-label="من تاريخ" />
            <span className="text-sm text-muted-foreground">إلى</span>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-40" aria-label="إلى تاريخ" />
            <Button type="submit" size="sm">
              عرض
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
