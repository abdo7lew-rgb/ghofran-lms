"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { createTeacherAction, updateTeacherAction, type TeacherFormState } from "@/lib/actions/teachers";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Teacher = { id: number; name: string; email: string };

const initialState: TeacherFormState = {};

export function TeacherDialog({ teacher }: { teacher?: Teacher }) {
  const [open, setOpen] = React.useState(false);
  const action = teacher ? updateTeacherAction : createTeacherAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = !!teacher;

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
            إضافة مدرس
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل بيانات المدرس" : "إضافة مدرس جديد"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل بيانات المدرس. اترك كلمة المرور فارغة إن لم ترغب بتغييرها."
              : "أدخل بيانات المدرس الجديد وكلمة مرور مبدئية له."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={teacher.id} />}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input id="name" name="name" required defaultValue={teacher?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" dir="ltr" required defaultValue={teacher?.email} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{isEdit ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور المبدئية"}</Label>
            <Input id="password" name="password" type="password" required={!isEdit} minLength={isEdit ? undefined : 8} />
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
