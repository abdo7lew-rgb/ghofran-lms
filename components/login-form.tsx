"use client";

import { useActionState } from "react";
import { BookOpenText, Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: LoginState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpenText className="size-6" />
        </div>
        <CardTitle className="text-xl">منظومة حلقات تحفيظ القرآن</CardTitle>
        <CardDescription>مسجد الغفران - تسجيل الدخول</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2">
            {pending && <Loader2 className="animate-spin" />}
            دخول
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
