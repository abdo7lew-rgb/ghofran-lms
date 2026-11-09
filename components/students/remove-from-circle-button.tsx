"use client";

import * as React from "react";
import { Loader2, UserMinus } from "lucide-react";
import { removeStudentFromCircleAction } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** إلغاء الطالب من حلقته (بدون حذف) — تبقى كل بياناته وسجلاته محفوظة. */
export function RemoveFromCircleButton({
  studentId,
  studentName,
  trigger,
}: {
  studentId: number;
  studentName: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      await removeStudentFromCircleAction(studentId);
      setOpen(false);
    } catch {
      setError("تعذّر إلغاء الطالب من الحلقة.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" aria-label="إلغاء من الحلقة" title="إلغاء من الحلقة">
            <UserMinus className="text-amber-600" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إلغاء {studentName} من الحلقة</DialogTitle>
          <DialogDescription>
            الطالب لن يُحذف. ستبقى كل بياناته وسجلات حضوره وحفظه محفوظة كما هي، لكنه سيخرج من قائمة
            الحلقة والحضور والتسميع، ولن يدخل في نسب وتقييم الحلقة والمدرس. يمكن للشيخ الرئيسي إرجاعه
            لأي حلقة لاحقاً من صفحة الطلبة.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            رجوع
          </Button>
          <Button onClick={handleConfirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            إلغاء من الحلقة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
