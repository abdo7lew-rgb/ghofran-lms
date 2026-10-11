"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus, Plus, RotateCcw, UserX, X } from "lucide-react";
import {
  markAbsentAction,
  quickRecordAction,
  undoQuickAction,
  type ReciteRow,
  type UndoToken,
} from "@/lib/actions/recite";
import { MemorizationDialog } from "@/components/memorization/memorization-dialog";
import { Button } from "@/components/ui/button";
import { SURAHS } from "@/lib/quran/surahs";
import { cn } from "@/lib/utils";

type Range = { surahNumber: number; fromAyah: number; toAyah: number };
type Toast = { message: string; undo: UndoToken };

const surahOf = (n: number) => SURAHS.find((s) => s.number === n);

function isDone(r: ReciteRow) {
  return r.sessions.length > 0 || r.attendance === "ABSENT" || r.attendance === "EXCUSED";
}

function doneLabel(r: ReciteRow) {
  if (r.attendance === "ABSENT") return { text: "غائب", tone: "muted" as const };
  if (r.attendance === "EXCUSED") return { text: "غائب بإذن", tone: "muted" as const };
  const s = r.sessions.find((x) => x.sessionType === "NEW") ?? r.sessions[0];
  if (s.result === "MEMORIZED") return { text: "حافظ", tone: "good" as const };
  if (s.result === "NOT_MEMORIZED") return { text: "لم يحفظ", tone: "bad" as const };
  return { text: s.sessionType === "REVIEW" ? "مراجعة" : "بدون تقييم", tone: "info" as const };
}

const TONES = {
  good: "border-success/40 bg-success/10 text-success",
  bad: "border-destructive/40 bg-destructive/10 text-destructive",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  muted: "border-border bg-muted text-muted-foreground",
};

export function ReciteBoard({ rows, date, circleName }: { rows: ReciteRow[]; date: string; circleName: string }) {
  const router = useRouter();
  const [ranges, setRanges] = React.useState<Record<number, Range>>({});
  const [busy, setBusy] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<Toast | null>(null);
  const [, startTransition] = React.useTransition();
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = rows.filter(isDone);
  const pending = rows.filter((r) => !isDone(r));
  const progress = rows.length ? Math.round((done.length / rows.length) * 100) : 0;

  function rangeOf(r: ReciteRow): Range | null {
    return ranges[r.studentId] ?? (r.suggestion ? { ...r.suggestion } : null);
  }

  function adjust(r: ReciteRow, edge: "fromAyah" | "toAyah", delta: number) {
    const current = rangeOf(r);
    if (!current) return;
    const max = surahOf(current.surahNumber)?.totalAyahs ?? 1;
    const next = { ...current, [edge]: Math.min(Math.max(current[edge] + delta, 1), max) };
    if (next.fromAyah > next.toAyah) return;
    setRanges((prev) => ({ ...prev, [r.studentId]: next }));
  }

  function showToast(message: string, undo: UndoToken) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = setTimeout(() => setToast(null), 7000);
  }

  async function run(r: ReciteRow, action: () => Promise<{ ok: true; undo: UndoToken } | { ok: false; error: string }>, label: string) {
    setBusy(r.studentId);
    setError(null);
    try {
      const res = await action();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showToast(`${r.fullName}: ${label}`, res.undo);
      startTransition(() => router.refresh());
    } catch {
      setError("تعذّر الحفظ، حاول مرة أخرى");
    } finally {
      setBusy(null);
    }
  }

  function record(r: ReciteRow, rating: "MEMORIZED" | "NOT_MEMORIZED") {
    const range = rangeOf(r);
    if (!range) return;
    void run(
      r,
      () => quickRecordAction({ studentId: r.studentId, date, rating, ...range }),
      rating === "MEMORIZED" ? "حافظ" : "لم يحفظ"
    );
  }

  function absent(r: ReciteRow, status: "ABSENT" | "EXCUSED") {
    void run(r, () => markAbsentAction({ studentId: r.studentId, date, status }), status === "ABSENT" ? "غائب" : "غائب بإذن");
  }

  async function undo() {
    if (!toast) return;
    const token = toast.undo;
    setToast(null);
    await undoQuickAction(token);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="sticky top-14 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:top-14">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold">{circleName}</span>
          <span className="tabular-nums text-muted-foreground">
            سجّلت {done.length} من {rows.length}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {pending.length === 0 && rows.length > 0 && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-6 text-center">
          <p className="text-lg font-bold text-success">ما شاء الله، سجّلت الحلقة كاملة</p>
          <p className="text-sm text-muted-foreground">يمكنك مراجعة ما سُجّل في الأسفل</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {pending.map((r, index) => {
          const range = rangeOf(r);
          const surah = range ? surahOf(range.surahNumber) : undefined;
          const isBusy = busy === r.studentId;
          return (
            <div
              key={r.studentId}
              className={cn(
                "rounded-xl border bg-card p-4 shadow-sm transition-all",
                index === 0 && "border-primary/50 ring-2 ring-primary/15"
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold leading-tight">{r.fullName}</p>
                  {r.attendance === "LATE" && <p className="text-xs text-muted-foreground">متأخر</p>}
                </div>
                {isBusy && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
              </div>

              {range && surah ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="font-semibold">{surah.nameArabic}</span>
                  <div className="flex items-center gap-1" dir="rtl">
                    <Stepper value={range.fromAyah} onMinus={() => adjust(r, "fromAyah", -1)} onPlus={() => adjust(r, "fromAyah", 1)} label="من" />
                    <span className="px-1 text-muted-foreground">←</span>
                    <Stepper value={range.toAyah} onMinus={() => adjust(r, "toAyah", -1)} onPlus={() => adjust(r, "toAyah", 1)} label="إلى" />
                  </div>
                </div>
              ) : (
                <p className="mb-3 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  لا توجد جلسات سابقة لاقتراح المقطع — استعمل «تسجيل مفصّل»
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-12 bg-success text-base text-success-foreground hover:bg-success/90"
                  disabled={!range || isBusy}
                  onClick={() => record(r, "MEMORIZED")}
                >
                  <Check className="size-5" />
                  حافظ
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 text-base"
                  disabled={!range || isBusy}
                  onClick={() => record(r, "NOT_MEMORIZED")}
                >
                  <X className="size-5" />
                  لم يحفظ
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <MemorizationDialog
                  students={[{ id: r.studentId, fullName: r.fullName, circleName: "" }]}
                  defaultStudentId={r.studentId}
                  defaultDate={date}
                  defaultSessionType="REVIEW"
                  trigger={
                    <Button variant="outline" size="sm" disabled={isBusy}>
                      مراجعة
                    </Button>
                  }
                />
                <MemorizationDialog
                  students={[{ id: r.studentId, fullName: r.fullName, circleName: "" }]}
                  defaultStudentId={r.studentId}
                  defaultDate={date}
                  trigger={
                    <Button variant="ghost" size="sm" disabled={isBusy}>
                      تسجيل مفصّل
                    </Button>
                  }
                />
                <div className="ms-auto flex gap-2">
                  <Button variant="outline" size="sm" disabled={isBusy} onClick={() => absent(r, "EXCUSED")}>
                    بإذن
                  </Button>
                  <Button variant="outline" size="sm" disabled={isBusy} onClick={() => absent(r, "ABSENT")}>
                    <UserX />
                    غائب
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">تم تسجيلهم ({done.length})</h3>
          <ul className="divide-y rounded-xl border bg-card">
            {done.map((r) => {
              const label = doneLabel(r);
              const s = r.sessions[0];
              return (
                <li key={r.studentId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium">{r.fullName}</p>
                    {s && <p className="text-xs text-muted-foreground">{r.sessions.map((x) => x.summary).join(" — ")}</p>}
                  </div>
                  <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONES[label.tone])}>
                    {label.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-3 text-background shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm">تم: {toast.message}</span>
          <button type="button" onClick={undo} className="inline-flex items-center gap-1 text-sm font-semibold underline">
            <RotateCcw className="size-4" />
            تراجع
          </button>
        </div>
      )}
    </div>
  );
}

function Stepper({ value, onMinus, onPlus, label }: { value: number; onMinus: () => void; onPlus: () => void; label: string }) {
  return (
    <div className="flex items-center rounded-md border bg-background" aria-label={label}>
      <button type="button" onClick={onMinus} className="flex size-8 items-center justify-center hover:bg-accent" aria-label={`${label} −`}>
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-8 text-center font-bold tabular-nums">{value}</span>
      <button type="button" onClick={onPlus} className="flex size-8 items-center justify-center hover:bg-accent" aria-label={`${label} +`}>
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
