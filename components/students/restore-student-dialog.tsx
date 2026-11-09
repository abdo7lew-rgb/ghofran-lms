"use client";

import * as React from "react";
import { Loader2, UserPlus } from "lucide-react";
import { restoreStudentAction } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

/** إرجاع طالب ملغى إلى حلقة (للشيخ الرئيسي). الحلقة السابقة مختارة افتراضياً. */
export function RestoreStudentDialog({
  studentId,
  studentName,
  lastCircleId,
  circleOptions,
}: {
  studentId: number;
  studentName: string;
  lastCircleId: number;
  circleOptions: CircleOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const defaultId = circleOptions.some((c) => c.id === lastCircleId)
    ? String(lastCircleId)
    : circleOptions[0]
      ? String(circleOptions[0].id)
      : "";
  const [targetCircleId, setTargetCircleId] = React.useState(defaultId);

  async function handleConfirm() {
    if (!targetCircleId) return;
    setPending(true);
    setError(null);
    try {
      await restoreStudentAction(studentId, Number(targetCircleId));
      setOpen(false);
    } catch {
      setError("تعذّر إرجاع الطالب.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={circleOptions.length === 0}>
          <UserPlus />
          إرجاع لحلقة
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إرجاع {studentName} إلى حلقة</DialogTitle>
          <DialogDescription>
            يرجع الطالب نشطاً في الحلقة المختارة مع كل سجلاته السابقة.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">الحلقة</label>
          <Select value={targetCircleId} onValueChange={setTargetCircleId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الحلقة" />
            </SelectTrigger>
            <SelectContent>
              {circleOptions.map((c) => (
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
            إرجاع الطالب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
