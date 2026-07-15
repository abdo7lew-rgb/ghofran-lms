"use server";

import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type LoginState = { error?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  if (!email || !password) {
    return { error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    throw error;
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export type ChangePasswordState = { error?: string; success?: boolean };

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await requireSession();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "الرجاء تعبئة جميع الحقول" };
  }
  if (newPassword.length < 8) {
    return { error: "يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "كلمة المرور الجديدة غير متطابقة" };
  }

  const [user] = await db.select().from(users).where(eq(users.id, Number(session.user.id))).limit(1);
  if (!user) return { error: "تعذر العثور على المستخدم" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "كلمة المرور الحالية غير صحيحة" };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  return { success: true };
}
