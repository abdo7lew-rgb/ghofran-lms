"use server";

import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession, accessibleCircleIds, assertStudentAccess } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { students, circles, memorizationSessions } from "@/lib/db/schema";
import { isValidAyahRange, getSurah } from "@/lib/quran/surahs";

export type SessionType = "NEW" | "REVIEW";
export type Rating = "EXCELLENT" | "VERY_GOOD" | "GOOD" | "ACCEPTABLE" | "WEAK";

export async function listRecentSessions(circleId?: number) {
  await requireSession();
  const ids = await accessibleCircleIds();

  let circleIds: number[];
  if (circleId) {
    circleIds = [circleId];
  } else if (ids === null) {
    circleIds = (await db.select({ id: circles.id }).from(circles)).map((c) => c.id);
  } else {
    circleIds = ids;
  }
  if (ids !== null) {
    circleIds = circleIds.filter((id) => ids.includes(id));
  }
  if (circleIds.length === 0) return [];

  const roster = await db.select().from(students).where(inArray(students.circleId, circleIds));
  if (roster.length === 0) return [];
  const studentMap = new Map(roster.map((s) => [s.id, s.fullName]));

  const sessions = await db
    .select()
    .from(memorizationSessions)
    .where(inArray(memorizationSessions.studentId, roster.map((s) => s.id)))
    .orderBy(desc(memorizationSessions.date), desc(memorizationSessions.id))
    .limit(100);

  return sessions.map((s) => ({ ...s, studentName: studentMap.get(s.studentId) ?? "" }));
}

const sessionSchema = z
  .object({
    studentId: z.coerce.number(),
    date: z.string().min(1, "الرجاء تحديد التاريخ"),
    sessionType: z.enum(["NEW", "REVIEW"]),
    surahNumber: z.coerce.number().int().min(1).max(114),
    fromAyah: z.coerce.number().int().min(1),
    toAyah: z.coerce.number().int().min(1),
    rating: z.enum(["EXCELLENT", "VERY_GOOD", "GOOD", "ACCEPTABLE", "WEAK"]),
    notes: z.string().trim().optional(),
  })
  .refine((data) => isValidAyahRange(data.surahNumber, data.fromAyah, data.toAyah), {
    message: "مدى الآيات غير صحيح لهذه السورة",
    path: ["toAyah"],
  });

export type MemorizationFormState = { error?: string; success?: boolean };

export async function createMemorizationSessionAction(
  _prevState: MemorizationFormState,
  formData: FormData
): Promise<MemorizationFormState> {
  const parsed = sessionSchema.safeParse({
    studentId: formData.get("studentId"),
    date: formData.get("date"),
    sessionType: formData.get("sessionType"),
    surahNumber: formData.get("surahNumber"),
    fromAyah: formData.get("fromAyah"),
    toAyah: formData.get("toAyah"),
    rating: formData.get("rating"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const session = await assertStudentAccess(parsed.data.studentId);

  await db.insert(memorizationSessions).values({
    studentId: parsed.data.studentId,
    date: parsed.data.date,
    sessionType: parsed.data.sessionType,
    surahNumber: parsed.data.surahNumber,
    fromAyah: parsed.data.fromAyah,
    toAyah: parsed.data.toAyah,
    rating: parsed.data.rating,
    notes: parsed.data.notes || null,
    recordedBy: Number(session.user.id),
  });

  revalidatePath("/memorization");
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMemorizationSessionAction(id: number, studentId: number) {
  await assertStudentAccess(studentId);
  await db.delete(memorizationSessions).where(eq(memorizationSessions.id, id));
  revalidatePath("/memorization");
  revalidatePath(`/students/${studentId}`);
}

export async function getStudentMemorizationHistory(studentId: number) {
  await assertStudentAccess(studentId);
  return db
    .select()
    .from(memorizationSessions)
    .where(eq(memorizationSessions.studentId, studentId))
    .orderBy(desc(memorizationSessions.date), desc(memorizationSessions.id));
}

export async function getStudentLastPosition(studentId: number) {
  await assertStudentAccess(studentId);
  const [last] = await db
    .select()
    .from(memorizationSessions)
    .where(and(eq(memorizationSessions.studentId, studentId), eq(memorizationSessions.sessionType, "NEW")))
    .orderBy(desc(memorizationSessions.date), desc(memorizationSessions.id))
    .limit(1);

  if (!last) return null;

  let nextSurah = last.surahNumber;
  let nextAyah = last.toAyah + 1;
  const surah = getSurah(last.surahNumber);
  if (surah && nextAyah > surah.totalAyahs) {
    nextSurah = last.surahNumber < 114 ? last.surahNumber + 1 : 1;
    nextAyah = 1;
  }

  return { last, next: { surahNumber: nextSurah, ayah: nextAyah } };
}
