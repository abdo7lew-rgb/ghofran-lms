"use server";

import { z } from "zod";
import { eq, count, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin, requireSession, accessibleCircleIds } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { circles, circleTeachers, users, students } from "@/lib/db/schema";

export async function listCirclesWithStats() {
  await requireSuperAdmin();

  const circleRows = await db.select().from(circles);
  const teacherRows = await db.select().from(users).where(eq(users.role, "TEACHER"));
  const membershipRows = await db.select().from(circleTeachers);
  const studentCounts = await db
    .select({ circleId: students.circleId, total: count() })
    .from(students)
    .groupBy(students.circleId);

  return circleRows.map((c) => {
    const teacherIds = membershipRows.filter((m) => m.circleId === c.id).map((m) => m.teacherId);
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      teacherIds,
      teacherNames: teacherRows.filter((t) => teacherIds.includes(t.id)).map((t) => t.name),
      studentCount: studentCounts.find((s) => s.circleId === c.id)?.total ?? 0,
    };
  });
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
  return db.select().from(circles).where(inArray(circles.id, ids));
}

const circleSchema = z.object({
  name: z.string().trim().min(2, "اسم الحلقة قصير جداً"),
  description: z.string().trim().optional(),
  teacherIds: z.array(z.coerce.number()).default([]),
});

export type CircleFormState = { error?: string; success?: boolean };

/** يستبدل مجموعة مدرسي الحلقة بالكامل بالمجموعة الجديدة المُرسَلة (حذف القديم وإدراج الجديد). */
async function syncCircleTeachers(circleId: number, teacherIds: number[]) {
  await db.delete(circleTeachers).where(eq(circleTeachers.circleId, circleId));
  if (teacherIds.length > 0) {
    await db.insert(circleTeachers).values(teacherIds.map((teacherId) => ({ circleId, teacherId })));
  }
}

export async function createCircleAction(
  _prevState: CircleFormState,
  formData: FormData
): Promise<CircleFormState> {
  await requireSuperAdmin();

  const parsed = circleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    teacherIds: formData.getAll("teacherIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const [inserted] = await db
    .insert(circles)
    .values({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .returning({ id: circles.id });

  await syncCircleTeachers(inserted.id, parsed.data.teacherIds);

  revalidatePath("/circles");
  revalidatePath("/teachers");
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
    teacherIds: formData.getAll("teacherIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await db
    .update(circles)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .where(eq(circles.id, parsed.data.id));

  await syncCircleTeachers(parsed.data.id, parsed.data.teacherIds);

  revalidatePath("/circles");
  revalidatePath("/teachers");
  return { success: true };
}

export async function deleteCircleAction(id: number) {
  await requireSuperAdmin();
  await db.delete(circles).where(eq(circles.id, id));
  revalidatePath("/circles");
  revalidatePath("/teachers");
}
