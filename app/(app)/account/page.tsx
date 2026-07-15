import { requireSession } from "@/lib/auth/guards";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountPage() {
  const session = await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">حسابي</h1>
        <p className="text-sm text-muted-foreground">
          {session.user.name} — {session.user.email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
          <CardDescription>يفضّل تغيير كلمة المرور المبدئية بعد أول تسجيل دخول</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
