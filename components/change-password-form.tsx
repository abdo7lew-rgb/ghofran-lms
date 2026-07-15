"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changePasswordAction, type ChangePasswordState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-success">تم تغيير كلمة المرور بنجاح</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending && <Loader2 className="animate-spin" />}
        حفظ
      </Button>
    </form>
  );
}
