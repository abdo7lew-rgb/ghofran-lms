"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus, Pencil, Sparkles, X } from "lucide-react";
import {
  createMemorizationSessionAction,
  updateMemorizationSessionAction,
  getNextSessionSuggestion,
  type MemorizationFormState,
  type SessionType,
  type SessionItemRecord,
} from "@/lib/actions/memorization";
import type { NextSuggestion } from "@/lib/quran/next-session";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { SURAHS } from "@/lib/quran/surahs";
import { HIZB_STARTS } from "@/lib/quran/hizb";
import { ALL_PORTIONS, getPortionEnd } from "@/lib/quran/athman";
import { ThumnPicker } from "@/components/memorization/thumn-picker";
import { StudentPicker } from "@/components/student-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type StudentOption = { id: number; fullName: string; circleName: string };

type FromMode = "number" | "text" | "none";

type ItemRow = {
  key: string;
  surahNumber: string;
  fromMode: FromMode;
  fromAyah: string;
  fromText: string;
  // فارغة = نفس surahNumber (مقطع ضمن سورة واحدة). تُستخدم للمراجعة أو لثمن يمتد عبر أكثر من سورة.
  toSurahNumber: string;
  toAyah: string;
  rating: string;
};

// جلسة موجودة للتعديل: التاريخ ونوعها وملاحظاتها ومقاطعها كما تُخزَّن في قاعدة البيانات
export type EditableSession = {
  id: number;
  date: string;
  sessionType: SessionType;
  notes: string | null;
  items: SessionItemRecord[];
};

const FROM_MODE_OPTIONS: { value: FromMode; label: string }[] = [
  { value: "number", label: "رقم آية" },
  { value: "text", label: "نص" },
  { value: "none", label: "بدون تحديد" },
];

const RATING_OPTIONS: { value: string; label: string }[] = [
  { value: "MEMORIZED", label: "حافظ" },
  { value: "NOT_MEMORIZED", label: "لم يحفظ" },
];

const initialState: MemorizationFormState = {};

let rowKeySeq = 0;
function newRow(defaults?: Partial<ItemRow>): ItemRow {
  rowKeySeq += 1;
  return {
    key: `row-${rowKeySeq}`,
    surahNumber: defaults?.surahNumber ?? "1",
    fromMode: defaults?.fromMode ?? "number",
    fromAyah: defaults?.fromAyah ?? "",
    fromText: defaults?.fromText ?? "",
    toSurahNumber: defaults?.toSurahNumber ?? "",
    toAyah: defaults?.toAyah ?? "",
    rating: defaults?.rating ?? "",
  };
}

const surahName = (n: number) => SURAHS.find((s) => s.number === n)?.nameArabic ?? "";

const BLANK_POSITION: Partial<ItemRow> = { surahNumber: "1", fromMode: "number", fromAyah: "", toSurahNumber: "", toAyah: "" };

// مقطع لم يلمسه المحفظ بعد (القيم الافتراضية)، فيصح ملؤه تلقائياً بالاقتراح
function isBlankRow(row: ItemRow) {
  return row.surahNumber === "1" && row.fromMode === "number" && !row.fromAyah && !row.toAyah && !row.toSurahNumber && !row.rating;
}

function suggestionFields(s: NextSuggestion): Partial<ItemRow> {
  return { surahNumber: String(s.surahNumber), fromMode: "number", fromAyah: String(s.fromAyah), toSurahNumber: "", toAyah: String(s.toAyah) };
}

function matchesSuggestion(row: ItemRow, s: NextSuggestion) {
  const f = suggestionFields(s);
  return row.surahNumber === f.surahNumber && row.fromAyah === f.fromAyah && row.toAyah === f.toAyah && !row.toSurahNumber;
}

function ayahCount(n: number) {
  if (n === 1) return "آية واحدة";
  if (n === 2) return "آيتان";
  return n <= 10 ? `${n} آيات` : `${n} آية`;
}

function suggestionText(s: NextSuggestion) {
  const where = `${surahName(s.surahNumber)} ${s.fromAyah}–${s.toAyah}`;
  const usual = s.usualAmount ? ` — مقداره المعتاد ${ayahCount(s.usualAmount)} (من آخر 5 جلسات)` : "";
  switch (s.mode) {
    case "repeat":
      return `يعيد ${where} لأنه لم يحفظه في آخر جلسة`;
    case "cumulative":
      return `يعيد ${surahName(s.surahNumber)} من الآية ${s.fromAyah} ويزيد حتى ${s.toAyah}${usual}`;
    case "next-surah":
      return `أكمل سورته السابقة، يبدأ ${where}${usual}`;
    default:
      return `يكمّل من ${where}${usual}`;
  }
}

function rowFromRecord(item: SessionItemRecord): ItemRow {
  rowKeySeq += 1;
  return {
    key: `row-${rowKeySeq}`,
    surahNumber: String(item.surahNumber),
    fromMode: item.fromAyah != null ? "number" : item.fromText ? "text" : "none",
    fromAyah: item.fromAyah != null ? String(item.fromAyah) : "",
    fromText: item.fromText ?? "",
    toSurahNumber: item.toSurahNumber != null ? String(item.toSurahNumber) : "",
    toAyah: item.toAyah != null ? String(item.toAyah) : "",
    rating: item.rating ?? "",
  };
}

export function MemorizationDialog({
  students,
  defaultStudentId,
  defaultDate,
  session,
  trigger,
}: {
  students: StudentOption[];
  defaultStudentId?: number;
  defaultDate?: string;
  /** إن مُررت، يعمل الحوار في وضع تعديل جلسة موجودة بدل إنشاء جلسة جديدة */
  session?: EditableSession;
  trigger?: React.ReactNode;
}) {
  const isEdit = !!session;
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateMemorizationSessionAction : createMemorizationSessionAction,
    initialState
  );

  const [studentId, setStudentId] = React.useState(defaultStudentId ? String(defaultStudentId) : "");
  const [sessionType, setSessionType] = React.useState<SessionType>(session?.sessionType ?? "NEW");
  const [items, setItems] = React.useState<ItemRow[]>(() =>
    session && session.items.length > 0 ? session.items.map(rowFromRecord) : [newRow()]
  );

  const fromLabel = sessionType === "NEW" ? "مطلع التسميع" : "من الآية";
  const toLabel = sessionType === "NEW" ? "نهاية التسميع" : "إلى الآية";

  useCloseOnSuccess(state, setOpen);

  const [suggestion, setSuggestion] = React.useState<NextSuggestion | null>(null);
  const lastSuggestionRef = React.useRef<NextSuggestion | null>(null);

  // إعادة ضبط النموذج عند الفتح (تعديل الحالة أثناء العرض مباشرة، بدون useEffect)
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSessionType(session?.sessionType ?? "NEW");
      setItems(session && session.items.length > 0 ? session.items.map(rowFromRecord) : [newRow()]);
      setSuggestion(null);
    }
  }

  // اقتراح الحفظ الجديد القادم: يملأ المقطع الوحيد إن كان فارغاً أو ما زال على اقتراح سابق (عند تغيير الطالب)
  React.useEffect(() => {
    if (!open || isEdit || sessionType !== "NEW" || !studentId) return;
    let cancelled = false;
    getNextSessionSuggestion(Number(studentId))
      .then((next) => {
        if (cancelled) return;
        const previous = lastSuggestionRef.current;
        lastSuggestionRef.current = next;
        setSuggestion(next);
        setItems((rows) => {
          if (rows.length !== 1) return rows;
          const row = rows[0];
          const untouched = isBlankRow(row) || (previous !== null && matchesSuggestion(row, previous));
          if (!untouched) return rows;
          return [{ ...row, ...(next ? suggestionFields(next) : BLANK_POSITION) }];
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, isEdit, sessionType, studentId]);

  const showSuggestion =
    suggestion !== null && sessionType === "NEW" && items.length === 1 && matchesSuggestion(items[0], suggestion);

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addItem() {
    const last = items[items.length - 1];
    setItems((prev) => [...prev, newRow(last ? { surahNumber: last.surahNumber } : undefined)]);
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

  const itemsPayload = JSON.stringify(
    items.map((row) => ({
      surahNumber: row.surahNumber,
      fromAyah: row.fromMode === "number" ? row.fromAyah : undefined,
      fromText: row.fromMode === "text" ? row.fromText : undefined,
      toSurahNumber: row.toSurahNumber || undefined,
      toAyah: row.toAyah,
      rating: row.rating || undefined,
    }))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ??
          (isEdit ? (
            <Button variant="ghost" size="icon" aria-label="تعديل الجلسة">
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus />
              تسجيل جلسة
            </Button>
          ))}
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => {
          // Escape داخل منتقي (ثمن/طالب) يغلق المنتقي فقط، لا نافذة التسجيل كلها
          if ((e.target as HTMLElement | null)?.closest?.("[data-picker]")) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل جلسة الحفظ أو المراجعة" : "تسجيل جلسة حفظ أو مراجعة"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={session.id} />}
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="sessionType" value={sessionType} />
          <input type="hidden" name="items" value={itemsPayload} />

          {!defaultStudentId && (
            <div className="flex flex-col gap-2">
              <Label>الطالب</Label>
              <StudentPicker
                students={students.map((s) => ({ id: s.id, name: s.fullName, circleName: s.circleName }))}
                value={studentId}
                onChange={setStudentId}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>نوع الجلسة</Label>
              <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">حفظ جديد</SelectItem>
                  <SelectItem value="REVIEW">مراجعة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={session?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>

          {showSuggestion && (
            <div className="flex items-start justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{suggestionText(suggestion)}</p>
                  <p className="text-xs text-muted-foreground">اقتراح تلقائي من جلساته السابقة — عدّله إن سمّع غير ذلك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItems((rows) => [{ ...rows[0], ...BLANK_POSITION }])}
                className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
              >
                مسح
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {items.map((row, index) => {
              const fromSurah = SURAHS.find((s) => s.number === Number(row.surahNumber));
              const isReviewSpan = sessionType === "REVIEW";
              const effectiveToSurahNumber = row.toSurahNumber || row.surahNumber;
              const toSurah = SURAHS.find((s) => s.number === Number(effectiveToSurahNumber));
              const spansMultipleSurahs = effectiveToSurahNumber !== row.surahNumber;

              // نعرض الاختيار الحالي في منتقيّ الحزب/الثمن استناداً إلى بيانات المقطع نفسها (لا حالة منفصلة)،
              // فيبقى ظاهراً بعد الاختيار (اسم السورة ونصّ المطلع) بدل أن يعود فارغاً
              const selectedHizb = HIZB_STARTS.find(
                (h) => String(h.surahNumber) === row.surahNumber && String(h.ayah) === row.fromAyah
              );
              const selectedPortion =
                row.fromMode === "number"
                  ? (ALL_PORTIONS.find(
                      (p) => String(p.surahNumber) === row.surahNumber && String(p.ayah) === row.fromAyah
                    ) ?? null)
                  : null;

              return (
                <div key={row.key} className="flex flex-col gap-3 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">مقطع {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeItem(row.key)}
                      disabled={items.length === 1}
                      aria-label="حذف المقطع"
                      className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {isReviewSpan && (
                    <div className="flex flex-col gap-2">
                      <Label className="text-muted-foreground">تعبئة سريعة: ابدأ من مطلع حزب</Label>
                      <Select
                        value={selectedHizb ? String(selectedHizb.hizb) : ""}
                        onValueChange={(v) => {
                          const h = HIZB_STARTS.find((x) => String(x.hizb) === v);
                          if (!h) return;
                          updateItem(row.key, {
                            surahNumber: String(h.surahNumber),
                            fromMode: "number",
                            fromAyah: String(h.ayah),
                            toSurahNumber: "",
                            toAyah: "",
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حزباً (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          {HIZB_STARTS.map((h) => (
                            <SelectItem key={h.hizb} value={String(h.hizb)}>
                              الحزب {h.hizb} — {SURAHS.find((s) => s.number === h.surahNumber)?.nameArabic} : الآية {h.ayah}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isReviewSpan ? (
                    <div className="flex flex-col gap-2">
                      <Label>من سورة</Label>
                      <Select value={row.surahNumber} onValueChange={(v) => updateItem(row.key, { surahNumber: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SURAHS.map((s) => (
                            <SelectItem key={s.number} value={String(s.number)}>
                              {s.number}. {s.nameArabic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>السورة</Label>
                        <Select value={row.surahNumber} onValueChange={(v) => updateItem(row.key, { surahNumber: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SURAHS.map((s) => (
                              <SelectItem key={s.number} value={String(s.number)}>
                                {s.number}. {s.nameArabic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>الثمن (اختياري)</Label>
                        <ThumnPicker
                          surahNumber={Number(row.surahNumber)}
                          selected={selectedPortion}
                          onSelect={(p) => {
                            const end = getPortionEnd(p.surahNumber, p.ayah);
                            updateItem(row.key, {
                              surahNumber: String(p.surahNumber),
                              fromMode: "number",
                              fromAyah: String(p.ayah),
                              toSurahNumber: end.surahNumber !== p.surahNumber ? String(end.surahNumber) : "",
                              toAyah: String(end.ayah),
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {isReviewSpan && (
                    <div className="flex flex-col gap-2">
                      <Label>إلى سورة (اتركها كما هي إن كانت المراجعة ضمن سورة واحدة)</Label>
                      <Select
                        value={effectiveToSurahNumber}
                        onValueChange={(v) => {
                          const patch: Partial<ItemRow> = { toSurahNumber: v === row.surahNumber ? "" : v };
                          if (v !== row.surahNumber) {
                            // تعبئة سريعة مريحة: مراجعة سورة/سور كاملة من مطلعها إلى ختامها
                            const targetSurah = SURAHS.find((s) => s.number === Number(v));
                            if (!row.fromAyah) patch.fromAyah = "1";
                            if (!row.toAyah && targetSurah) patch.toAyah = String(targetSurah.totalAyahs);
                          }
                          updateItem(row.key, patch);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SURAHS.map((s) => (
                            <SelectItem key={s.number} value={String(s.number)}>
                              {s.number}. {s.nameArabic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor={`fromAyah-${row.key}`}>{fromLabel}</Label>
                        <div className="flex gap-1">
                          {FROM_MODE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateItem(row.key, { fromMode: opt.value })}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[11px]",
                                row.fromMode === opt.value
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {row.fromMode === "number" && (
                        <Input
                          id={`fromAyah-${row.key}`}
                          type="number"
                          min={1}
                          max={fromSurah?.totalAyahs}
                          value={row.fromAyah}
                          onChange={(e) => updateItem(row.key, { fromAyah: e.target.value })}
                        />
                      )}
                      {row.fromMode === "text" && (
                        <Input
                          id={`fromAyah-${row.key}`}
                          type="text"
                          placeholder="مثال: بداية قصة موسى عليه السلام"
                          value={row.fromText}
                          onChange={(e) => updateItem(row.key, { fromText: e.target.value })}
                        />
                      )}
                      {row.fromMode === "none" && (
                        <p className="flex h-9 items-center text-xs text-muted-foreground">بدون تحديد مطلع</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`toAyah-${row.key}`}>{toLabel} (اختياري)</Label>
                      <Input
                        id={`toAyah-${row.key}`}
                        type="number"
                        min={1}
                        max={toSurah?.totalAyahs}
                        placeholder="بدون تحديد"
                        value={row.toAyah}
                        onChange={(e) => updateItem(row.key, { toAyah: e.target.value })}
                      />
                    </div>
                  </div>
                  {fromSurah && (
                    <p className="-mt-2 text-xs text-muted-foreground">
                      عدد آيات {fromSurah.nameArabic}: {fromSurah.totalAyahs}
                      {spansMultipleSurahs && toSurah ? ` — عدد آيات ${toSurah.nameArabic}: ${toSurah.totalAyahs}` : ""}
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label>تقييم الأداء (اختياري)</Label>
                    <Select
                      value={row.rating || "__NONE__"}
                      onValueChange={(v) => updateItem(row.key, { rating: v === "__NONE__" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__NONE__">بدون تقييم</SelectItem>
                        {RATING_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}

            <Button type="button" variant="outline" size="sm" onClick={addItem} className="self-start">
              <Plus />
              إضافة مقطع آخر
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" name="notes" defaultValue={session?.notes ?? ""} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !studentId}>
              {pending && <Loader2 className="animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
