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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Circle = { id: number; name: string; description: string | null; teacherIds: number[] };
type TeacherOption = { id: number; name: string };

const initialState: CircleFormState = {};

export function CircleDialog({ circle, teacherOptions }: { circle?: Circle; teacherOptions: TeacherOption[] }) {
  const [open, setOpen] = React.useState(false);
  const action = circle ? updateCircleAction : createCircleAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = !!circle;
  const [teacherIds, setTeacherIds] = React.useState<number[]>(circle?.teacherIds ?? []);

  useCloseOnSuccess(state, setOpen);

  function toggleTeacher(id: number, checked: boolean) {
    setTeacherIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

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
          {teacherIds.map((id) => (
            <input key={id} type="hidden" name="teacherIds" value={id} />
          ))}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">اسم الحلقة</Label>
            <Input id="name" name="name" required defaultValue={circle?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea id="description" name="description" defaultValue={circle?.description ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>المدرسون المسؤولون</Label>
            <DialogDescription className="-mt-1">يمكن إسناد أكثر من مدرس لنفس الحلقة</DialogDescription>
            {teacherOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد مدرسون بعد</p>
            ) : (
              <div className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-md border p-3">
                {teacherOptions.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={teacherIds.includes(t.id)}
                      onCheckedChange={(checked) => toggleTeacher(t.id, checked === true)}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            )}
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
