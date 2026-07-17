"use server";

import { z } from "zod";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession, accessibleCircleIds, assertStudentAccess } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { students, circles, memorizationSessions, memorizationSessionItems } from "@/lib/db/schema";
import { isValidAyahRange, getSurah } from "@/lib/quran/surahs";

export type SessionType = "NEW" | "REVIEW";
export type Rating = "EXCELLENT" | "VERY_GOOD" | "GOOD" | "ACCEPTABLE" | "WEAK";

export type SessionItemRecord = {
  id: number;
  sessionId: number;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  rating: Rating | null;
  sortOrder: number;
};

/** يجلب مقاطع مجموعة من الجلسات ويجمّعها حسب رقم الجلسة، مرتّبة حسب ترتيب الإدخال */
async function fetchItemsBySessionIds(sessionIds: number[]): Promise<Map<number, SessionItemRecord[]>> {
  const map = new Map<number, SessionItemRecord[]>();
  if (sessionIds.length === 0) return map;
  const items = await db
    .select()
    .from(memorizationSessionItems)
    .where(inArray(memorizationSessionItems.sessionId, sessionIds))
    .orderBy(asc(memorizationSessionItems.sortOrder), asc(memorizationSessionItems.id));
  for (const item of items) {
    const list = map.get(item.sessionId) ?? [];
    list.push(item);
    map.set(item.sessionId, list);
  }
  return map;
}

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

  const itemsBySession = await fetchItemsBySessionIds(sessions.map((s) => s.id));

  return sessions.map((s) => ({
    ...s,
    studentName: studentMap.get(s.studentId) ?? "",
    items: itemsBySession.get(s.id) ?? [],
  }));
}

const itemSchema = z
  .object({
    surahNumber: z.coerce.number().int().min(1).max(114),
    fromAyah: z.coerce.number().int().min(1),
    toAyah: z.coerce.number().int().min(1),
    rating: z.enum(["EXCELLENT", "VERY_GOOD", "GOOD", "ACCEPTABLE", "WEAK"]).optional(),
  })
  .refine((data) => isValidAyahRange(data.surahNumber, data.fromAyah, data.toAyah), {
    message: "مدى الآيات غير صحيح لهذه السورة",
    path: ["toAyah"],
  });

const sessionSchema = z.object({
  studentId: z.coerce.number(),
  date: z.string().min(1, "الرجاء تحديد التاريخ"),
  sessionType: z.enum(["NEW", "REVIEW"]),
  notes: z.string().trim().optional(),
  items: z.array(itemSchema).min(1, "أضف مقطعاً واحداً على الأقل"),
});

export type MemorizationFormState = { error?: string; success?: boolean };

export async function createMemorizationSessionAction(
  _prevState: MemorizationFormState,
  formData: FormData
): Promise<MemorizationFormState> {
  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "بيانات المقاطع غير صحيحة" };
  }

  const parsed = sessionSchema.safeParse({
    studentId: formData.get("studentId"),
    date: formData.get("date"),
    sessionType: formData.get("sessionType"),
    notes: formData.get("notes"),
    items: itemsRaw,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const session = await assertStudentAccess(parsed.data.studentId);

  const [inserted] = await db
    .insert(memorizationSessions)
    .values({
      studentId: parsed.data.studentId,
      date: parsed.data.date,
      sessionType: parsed.data.sessionType,
      notes: parsed.data.notes || null,
      recordedBy: Number(session.user.id),
    })
    .returning({ id: memorizationSessions.id });

  await db.insert(memorizationSessionItems).values(
    parsed.data.items.map((item, index) => ({
      sessionId: inserted.id,
      surahNumber: item.surahNumber,
      fromAyah: item.fromAyah,
      toAyah: item.toAyah,
      rating: item.rating ?? null,
      sortOrder: index,
    }))
  );

  revalidatePath("/memorization");
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMemorizationSessionAction(id: number, studentId: number) {
  await assertStudentAccess(studentId);
  // حذف الجلسة يحذف كل مقاطعها تلقائياً (onDelete cascade)
  await db.delete(memorizationSessions).where(eq(memorizationSessions.id, id));
  revalidatePath("/memorization");
  revalidatePath(`/students/${studentId}`);
}

export async function getStudentMemorizationHistory(studentId: number) {
  await assertStudentAccess(studentId);
  const sessions = await db
    .select()
    .from(memorizationSessions)
    .where(eq(memorizationSessions.studentId, studentId))
    .orderBy(desc(memorizationSessions.date), desc(memorizationSessions.id));

  const itemsBySession = await fetchItemsBySessionIds(sessions.map((s) => s.id));

  return sessions.map((s) => ({ ...s, items: itemsBySession.get(s.id) ?? [] }));
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

  // نقطة حساسة: نأخذ آخر مقطع تم إدخاله في آخر جلسة تسميع جديد (بترتيب الإدخال)
  // كنقطة انطلاق لتحديد "بداية التسميع القادم" — تحقق من صحتها بعد التنفيذ خاصة عند تغيّر السورة داخل نفس الجلسة
  const [lastItem] = await db
    .select()
    .from(memorizationSessionItems)
    .where(eq(memorizationSessionItems.sessionId, last.id))
    .orderBy(desc(memorizationSessionItems.sortOrder), desc(memorizationSessionItems.id))
    .limit(1);

  if (!lastItem) return null;

  let nextSurah = lastItem.surahNumber;
  let nextAyah = lastItem.toAyah + 1;
  const surah = getSurah(lastItem.surahNumber);
  if (surah && nextAyah > surah.totalAyahs) {
    nextSurah = lastItem.surahNumber < 114 ? lastItem.surahNumber + 1 : 1;
    nextAyah = 1;
  }

  return {
    last: {
      date: last.date,
      surahNumber: lastItem.surahNumber,
      fromAyah: lastItem.fromAyah,
      toAyah: lastItem.toAyah,
    },
    next: { surahNumber: nextSurah, ayah: nextAyah },
  };
}
