"use server";

import { z } from "zod";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin, requireSession, accessibleCircleIds } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { circles, users, students } from "@/lib/db/schema";

export async function listCirclesWithStats() {
  await requireSuperAdmin();

  const circleRows = await db.select().from(circles);
  const teacherRows = await db.select().from(users).where(eq(users.role, "TEACHER"));
  const studentCounts = await db
    .select({ circleId: students.circleId, total: count() })
    .from(students)
    .groupBy(students.circleId);

  return circleRows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    teacherId: c.teacherId,
    teacherName: teacherRows.find((t) => t.id === c.teacherId)?.name ?? null,
    studentCount: studentCounts.find((s) => s.circleId === c.id)?.total ?? 0,
  }));
}

export async function listTeacherOptions() {
  await requireSuperAdmin();
  return db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "TEACHER"));
}

/** الحلقات التي يمكن للمستخدم الحالي الوصول إليها (كل الحلقات للشيخ، أو حلقاته فقط للمدرس). */
export async function listMyCircles() {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") {
    return db.select().from(circles);
  }
  const ids = await accessibleCircleIds();
  if (!ids || ids.length === 0) return [];
  const rows = await db.select().from(circles);
  return rows.filter((c) => ids.includes(c.id));
}

const circleSchema = z.object({
  name: z.string().trim().min(2, "اسم الحلقة قصير جداً"),
  description: z.string().trim().optional(),
  teacherId: z.string().optional(),
});

export type CircleFormState = { error?: string; success?: boolean };

export async function createCircleAction(
  _prevState: CircleFormState,
  formData: FormData
): Promise<CircleFormState> {
  await requireSuperAdmin();

  const parsed = circleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    teacherId: formData.get("teacherId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await db.insert(circles).values({
    name: parsed.data.name,
    description: parsed.data.description || null,
    teacherId: parsed.data.teacherId ? Number(parsed.data.teacherId) : null,
  });

  revalidatePath("/circles");
  return { success: true };
}

const circleUpdateSchema = circleSchema.extend({ id: z.coerce.number() });

export async function updateCircleAction(
  _prevState: CircleFormState,
  formData: FormData
): Promise<CircleFormState> {
  await requireSuperAdmin();

  const parsed = circleUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    teacherId: formData.get("teacherId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await db
    .update(circles)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
      teacherId: parsed.data.teacherId ? Number(parsed.data.teacherId) : null,
    })
    .where(eq(circles.id, parsed.data.id));

  revalidatePath("/circles");
  return { success: true };
}

export async function deleteCircleAction(id: number) {
  await requireSuperAdmin();
  await db.delete(circles).where(eq(circles.id, id));
  revalidatePath("/circles");
}
