"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createMemorizationSessionAction, type MemorizationFormState } from "@/lib/actions/memorization";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { SURAHS } from "@/lib/quran/surahs";
import { HIZB_STARTS } from "@/lib/quran/hizb";
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

type ItemRow = {
  key: string;
  surahNumber: string;
  fromAyah: string;
  // فارغة = نفس surahNumber (مقطع ضمن سورة واحدة). تُستخدم فقط للمراجعة لدعم مدى يمتد عبر عدة سور.
  toSurahNumber: string;
  toAyah: string;
  rating: string;
};

const RATING_OPTIONS: { value: string; label: string }[] = [
  { value: "EXCELLENT", label: "ممتاز" },
  { value: "VERY_GOOD", label: "جيد جداً" },
  { value: "GOOD", label: "جيد" },
  { value: "ACCEPTABLE", label: "مقبول" },
  { value: "WEAK", label: "ضعيف" },
];

const initialState: MemorizationFormState = {};

let rowKeySeq = 0;
function newRow(defaults?: Partial<ItemRow>): ItemRow {
  rowKeySeq += 1;
  return {
    key: `row-${rowKeySeq}`,
    surahNumber: defaults?.surahNumber ?? "1",
    fromAyah: defaults?.fromAyah ?? "",
    toSurahNumber: defaults?.toSurahNumber ?? "",
    toAyah: defaults?.toAyah ?? "",
    rating: defaults?.rating ?? "",
  };
}

export function MemorizationDialog({
  students,
  defaultStudentId,
  trigger,
}: {
  students: StudentOption[];
  defaultStudentId?: number;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(createMemorizationSessionAction, initialState);

  const [studentId, setStudentId] = React.useState(
    defaultStudentId ? String(defaultStudentId) : students[0] ? String(students[0].id) : ""
  );
  const [sessionType, setSessionType] = React.useState("NEW");
  const [items, setItems] = React.useState<ItemRow[]>(() => [newRow()]);

  const fromLabel = sessionType === "NEW" ? "مطلع التسميع" : "من الآية";
  const toLabel = sessionType === "NEW" ? "نهاية التسميع" : "إلى الآية";

  useCloseOnSuccess(state, setOpen);

  // إعادة ضبط النموذج عند الفتح لجلسة جديدة (تعديل الحالة أثناء العرض مباشرة، بدون useEffect)
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setItems([newRow()]);
    }
  }

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
      fromAyah: row.fromAyah,
      toSurahNumber: sessionType === "REVIEW" && row.toSurahNumber ? row.toSurahNumber : undefined,
      toAyah: row.toAyah,
      rating: row.rating || undefined,
    }))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            تسجيل جلسة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تسجيل جلسة حفظ أو مراجعة</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="sessionType" value={sessionType} />
          <input type="hidden" name="items" value={itemsPayload} />

          {!defaultStudentId && (
            <div className="flex flex-col gap-2">
              <Label>الطالب</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.fullName} — {s.circleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>نوع الجلسة</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
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
              <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((row, index) => {
              const fromSurah = SURAHS.find((s) => s.number === Number(row.surahNumber));
              const isReviewSpan = sessionType === "REVIEW";
              const effectiveToSurahNumber = row.toSurahNumber || row.surahNumber;
              const toSurah = SURAHS.find((s) => s.number === Number(effectiveToSurahNumber));
              const spansMultipleSurahs = isReviewSpan && effectiveToSurahNumber !== row.surahNumber;

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
                        value=""
                        onValueChange={(v) => {
                          const h = HIZB_STARTS.find((x) => String(x.hizb) === v);
                          if (!h) return;
                          updateItem(row.key, {
                            surahNumber: String(h.surahNumber),
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

                  <div className="flex flex-col gap-2">
                    <Label>{isReviewSpan ? "من سورة" : "السورة"}</Label>
                    <Select
                      value={row.surahNumber}
                      onValueChange={(v) => updateItem(row.key, { surahNumber: v })}
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
                      <Label htmlFor={`fromAyah-${row.key}`}>{fromLabel}</Label>
                      <Input
                        id={`fromAyah-${row.key}`}
                        type="number"
                        min={1}
                        max={fromSurah?.totalAyahs}
                        required
                        value={row.fromAyah}
                        onChange={(e) => updateItem(row.key, { fromAyah: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`toAyah-${row.key}`}>{toLabel}</Label>
                      <Input
                        id={`toAyah-${row.key}`}
                        type="number"
                        min={1}
                        max={toSurah?.totalAyahs}
                        required
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
            <Textarea id="notes" name="notes" />
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
