"use server";

import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession, accessibleCircleIds, assertStudentAccess } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { students, circles } from "@/lib/db/schema";

export async function listStudents() {
  await requireSession();
  const ids = await accessibleCircleIds();

  const circleRows = ids === null ? await db.select().from(circles) : await db.select().from(circles).where(inArray(circles.id, ids.length ? ids : [-1]));
  const circleMap = new Map(circleRows.map((c) => [c.id, c.name]));

  const rows =
    ids === null
      ? await db.select().from(students)
      : ids.length
        ? await db.select().from(students).where(inArray(students.circleId, ids))
        : [];

  return rows
    .map((s) => ({ ...s, circleName: circleMap.get(s.circleId) ?? "" }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

/** الحلقات المتاحة للاختيار عند إضافة/تعديل طالب حسب دور المستخدم الحالي. */
export async function listCircleOptionsForStudentForm() {
  await requireSession();
  const ids = await accessibleCircleIds();
  return ids === null
    ? db.select({ id: circles.id, name: circles.name }).from(circles)
    : ids.length
      ? db.select({ id: circles.id, name: circles.name }).from(circles).where(inArray(circles.id, ids))
      : [];
}

async function assertCanUseCircle(circleId: number) {
  const ids = await accessibleCircleIds();
  if (ids !== null && !ids.includes(circleId)) {
    throw new Error("لا تملك صلاحية إضافة طالب لهذه الحلقة");
  }
}

const studentSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم قصير جداً"),
  age: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(3).max(100).optional()
  ),
  guardianName: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
  circleId: z.coerce.number({ message: "الرجاء اختيار الحلقة" }),
  joinDate: z.string().min(1, "الرجاء تحديد تاريخ الانضمام"),
  notes: z.string().trim().optional(),
});

export type StudentFormState = { error?: string; success?: boolean };

export async function createStudentAction(
  _prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  await requireSession();

  const parsed = studentSchema.safeParse({
    fullName: formData.get("fullName"),
    age: formData.get("age"),
    guardianName: formData.get("guardianName"),
    guardianPhone: formData.get("guardianPhone"),
    circleId: formData.get("circleId"),
    joinDate: formData.get("joinDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await assertCanUseCircle(parsed.data.circleId);

  await db.insert(students).values({
    fullName: parsed.data.fullName,
    age: parsed.data.age ?? null,
    guardianName: parsed.data.guardianName || null,
    guardianPhone: parsed.data.guardianPhone || null,
    circleId: parsed.data.circleId,
    joinDate: parsed.data.joinDate,
    notes: parsed.data.notes || null,
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { success: true };
}

const studentUpdateSchema = studentSchema.extend({ id: z.coerce.number() });

export async function updateStudentAction(
  _prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  await requireSession();

  const parsed = studentUpdateSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    age: formData.get("age"),
    guardianName: formData.get("guardianName"),
    guardianPhone: formData.get("guardianPhone"),
    circleId: formData.get("circleId"),
    joinDate: formData.get("joinDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await assertStudentAccess(parsed.data.id);
  await assertCanUseCircle(parsed.data.circleId);

  await db
    .update(students)
    .set({
      fullName: parsed.data.fullName,
      age: parsed.data.age ?? null,
      guardianName: parsed.data.guardianName || null,
      guardianPhone: parsed.data.guardianPhone || null,
      circleId: parsed.data.circleId,
      joinDate: parsed.data.joinDate,
      notes: parsed.data.notes || null,
    })
    .where(eq(students.id, parsed.data.id));

  revalidatePath("/students");
  revalidatePath(`/students/${parsed.data.id}`);
  return { success: true };
}

/**
 * ينقل طالباً إلى حلقة أخرى. لا يمسّ سجلات الحضور والحفظ أبداً لأنها مرتبطة برقم الطالب نفسه
 * (student_id) لا برقم الحلقة، فتبقى كاملة تلقائياً بعد النقل دون أي حاجة لترحيلها.
 */
export async function transferStudentAction(studentId: number, newCircleId: number) {
  await assertStudentAccess(studentId);
  await assertCanUseCircle(newCircleId);

  await db.update(students).set({ circleId: newCircleId }).where(eq(students.id, studentId));

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/circles");
  revalidatePath("/dashboard");
}

export async function deleteStudentAction(id: number) {
  await assertStudentAccess(id);
  await db.delete(students).where(eq(students.id, id));
  revalidatePath("/students");
  revalidatePath("/dashboard");
}

export async function getStudentProfile(id: number) {
  await assertStudentAccess(id);

  const [student] = await db.select().from(students).where(eq(students.id, id)).limit(1);
  if (!student) return null;

  const [circle] = await db.select().from(circles).where(eq(circles.id, student.circleId)).limit(1);

  return { student, circleName: circle?.name ?? "" };
}
