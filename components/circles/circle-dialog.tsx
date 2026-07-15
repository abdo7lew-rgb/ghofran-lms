"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { createCircleAction, updateCircleAction, type CircleFormState } from "@/lib/actions/circles";
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

type Circle = { id: number; name: string; description: string | null; teacherId: number | null };
type TeacherOption = { id: number; name: string };

const initialState: CircleFormState = {};
const NO_TEACHER = "none";

export function CircleDialog({ circle, teacherOptions }: { circle?: Circle; teacherOptions: TeacherOption[] }) {
  const [open, setOpen] = React.useState(false);
  const action = circle ? updateCircleAction : createCircleAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = !!circle;
  const [teacherId, setTeacherId] = React.useState(circle?.teacherId ? String(circle.teacherId) : NO_TEACHER);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="تعديل">
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus />
            إضافة حلقة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل الحلقة" : "إضافة حلقة جديدة"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={circle.id} />}
          <input type="hidden" name="teacherId" value={teacherId === NO_TEACHER ? "" : teacherId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">اسم الحلقة</Label>
            <Input id="name" name="name" required defaultValue={circle?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea id="description" name="description" defaultValue={circle?.description ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>المدرس المسؤول</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مدرساً" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEACHER}>بدون مدرس حالياً</SelectItem>
                {teacherOptions.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
