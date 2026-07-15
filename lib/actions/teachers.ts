"use server";

import { z } from "zod";
import { eq, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users, circles, students } from "@/lib/db/schema";

export async function listTeachersWithStats() {
  await requireSuperAdmin();

  const teachers = await db.select().from(users).where(eq(users.role, "TEACHER"));

  const circleRows = await db.select().from(circles);
  const studentCounts = await db
    .select({ circleId: students.circleId, total: count() })
    .from(students)
    .groupBy(students.circleId);

  return teachers.map((teacher) => {
    const teacherCircles = circleRows.filter((c) => c.teacherId === teacher.id);
    const studentTotal = teacherCircles.reduce((sum, c) => {
      const found = studentCounts.find((s) => s.circleId === c.id);
      return sum + (found?.total ?? 0);
    }, 0);
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      createdAt: teacher.createdAt,
      circles: teacherCircles.map((c) => c.name),
      studentCount: studentTotal,
    };
  });
}

const teacherSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً"),
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"),
});

export type TeacherFormState = { error?: string; success?: boolean };

export async function createTeacherAction(
  _prevState: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  await requireSuperAdmin();

  const parsed = teacherSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) {
    return { error: "هذا البريد الإلكتروني مستخدم بالفعل" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: "TEACHER",
  });

  revalidatePath("/teachers");
  return { success: true };
}

const teacherUpdateSchema = z.object({
  id: z.coerce.number(),
  name: z.string().trim().min(2, "الاسم قصير جداً"),
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل").optional().or(z.literal("")),
});

export async function updateTeacherAction(
  _prevState: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  await requireSuperAdmin();

  const parsed = teacherUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing && existing.id !== parsed.data.id) {
    return { error: "هذا البريد الإلكتروني مستخدم بالفعل" };
  }

  const values: Partial<typeof users.$inferInsert> = {
    name: parsed.data.name,
    email: parsed.data.email,
  };
  if (parsed.data.password) {
    values.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  await db.update(users).set(values).where(eq(users.id, parsed.data.id));

  revalidatePath("/teachers");
  return { success: true };
}

export async function deleteTeacherAction(id: number) {
  await requireSuperAdmin();
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/teachers");
}
