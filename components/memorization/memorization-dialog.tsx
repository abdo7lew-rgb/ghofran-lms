"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createMemorizationSessionAction, type MemorizationFormState } from "@/lib/actions/memorization";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { SURAHS } from "@/lib/quran/surahs";
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

const RATING_OPTIONS: { value: string; label: string }[] = [
  { value: "EXCELLENT", label: "ممتاز" },
  { value: "VERY_GOOD", label: "جيد جداً" },
  { value: "GOOD", label: "جيد" },
  { value: "ACCEPTABLE", label: "مقبول" },
  { value: "WEAK", label: "ضعيف" },
];

const initialState: MemorizationFormState = {};

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
  const [surahNumber, setSurahNumber] = React.useState("1");
  const [rating, setRating] = React.useState("GOOD");

  const surah = SURAHS.find((s) => s.number === Number(surahNumber));

  useCloseOnSuccess(state, setOpen);

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
          <input type="hidden" name="surahNumber" value={surahNumber} />
          <input type="hidden" name="rating" value={rating} />

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

          <div className="flex flex-col gap-2">
            <Label>السورة</Label>
            <Select value={surahNumber} onValueChange={setSurahNumber}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fromAyah">من الآية</Label>
              <Input id="fromAyah" name="fromAyah" type="number" min={1} max={surah?.totalAyahs} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="toAyah">إلى الآية</Label>
              <Input id="toAyah" name="toAyah" type="number" min={1} max={surah?.totalAyahs} required />
            </div>
          </div>
          {surah && (
            <p className="-mt-2 text-xs text-muted-foreground">عدد آيات السورة: {surah.totalAyahs}</p>
          )}

          <div className="flex flex-col gap-2">
            <Label>تقييم الأداء</Label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
