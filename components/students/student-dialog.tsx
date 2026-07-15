"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { createStudentAction, updateStudentAction, type StudentFormState } from "@/lib/actions/students";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
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

type Student = {
  id: number;
  fullName: string;
  age: number | null;
  guardianName: string | null;
  guardianPhone: string | null;
  circleId: number;
  joinDate: string;
  notes: string | null;
};
type CircleOption = { id: number; name: string };

const initialState: StudentFormState = {};

export function StudentDialog({
  student,
  circleOptions,
  trigger,
}: {
  student?: Student;
  circleOptions: CircleOption[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const action = student ? updateStudentAction : createStudentAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = !!student;
  const [circleId, setCircleId] = React.useState(
    student?.circleId ? String(student.circleId) : circleOptions[0] ? String(circleOptions[0].id) : ""
  );

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (isEdit ? (
          <Button variant="ghost" size="icon" aria-label="تعديل">
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus />
            إضافة طالب
          </Button>
        ))}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={student.id} />}
          <input type="hidden" name="circleId" value={circleId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input id="fullName" name="fullName" required defaultValue={student?.fullName} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="age">العمر</Label>
              <Input id="age" name="age" type="number" min={3} max={100} defaultValue={student?.age ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="joinDate">تاريخ الانضمام</Label>
              <Input
                id="joinDate"
                name="joinDate"
                type="date"
                required
                defaultValue={student?.joinDate ?? new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardianName">اسم ولي الأمر</Label>
              <Input id="guardianName" name="guardianName" defaultValue={student?.guardianName ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardianPhone">هاتف ولي الأمر</Label>
              <Input
                id="guardianPhone"
                name="guardianPhone"
                dir="ltr"
                defaultValue={student?.guardianPhone ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>الحلقة</Label>
            <Select value={circleId} onValueChange={setCircleId}>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" name="notes" defaultValue={student?.notes ?? ""} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !circleId}>
              {pending && <Loader2 className="animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
