"use client";

import * as React from "react";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { transferStudentAction } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CircleOption = { id: number; name: string };

export function TransferStudentDialog({
  studentId,
  studentName,
  currentCircleId,
  currentCircleName,
  circleOptions,
}: {
  studentId: number;
  studentName: string;
  currentCircleId: number;
  currentCircleName: string;
  circleOptions: CircleOption[];
}) {
  const otherCircles = circleOptions.filter((c) => c.id !== currentCircleId);
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [targetCircleId, setTargetCircleId] = React.useState(
    otherCircles[0] ? String(otherCircles[0].id) : ""
  );

  async function handleConfirm() {
    if (!targetCircleId) return;
    setPending(true);
    setError(null);
    try {
      await transferStudentAction(studentId, Number(targetCircleId));
      setOpen(false);
    } catch {
      setError("تعذّر نقل الطالب. تحقق من صلاحياتك على الحلقة المطلوبة.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="نقل إلى حلقة أخرى" disabled={otherCircles.length === 0}>
          <ArrowRightLeft />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>نقل {studentName} إلى حلقة أخرى</DialogTitle>
          <DialogDescription>
            الحلقة الحالية: {currentCircleName}. جميع سجلات الحضور والحفظ الخاصة بالطالب تبقى محفوظة
            كاملة كما هي بعد النقل — لا يُفقَد شيء منها إطلاقاً.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">الحلقة الجديدة</label>
          <Select value={targetCircleId} onValueChange={setTargetCircleId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الحلقة الجديدة" />
            </SelectTrigger>
            <SelectContent>
              {otherCircles.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            إلغاء
          </Button>
          <Button onClick={handleConfirm} disabled={pending || !targetCircleId}>
            {pending && <Loader2 className="animate-spin" />}
            نقل الطالب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
