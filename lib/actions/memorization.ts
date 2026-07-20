"use server";

import { z } from "zod";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession, accessibleCircleIds, assertStudentAccess } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { students, circles, memorizationSessions, memorizationSessionItems } from "@/lib/db/schema";
import { isValidAyahNumber, getSurah } from "@/lib/quran/surahs";

export type SessionType = "NEW" | "REVIEW";
export type Rating = "EXCELLENT" | "VERY_GOOD" | "GOOD" | "ACCEPTABLE" | "WEAK";

export type SessionItemRecord = {
  id: number;
  sessionId: number;
  surahNumber: number;
  fromAyah: number | null;
  fromText: string | null;
  toSurahNumber: number | null;
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
    // مطلع المقطع اختياري تماماً: إما رقم آية، أو نص حر يصف المطلع، أو بلا تحديد إطلاقاً
    fromAyah: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.coerce.number().int().min(1).optional()
    ),
    fromText: z.string().trim().max(300).optional(),
    toSurahNumber: z.coerce.number().int().min(1).max(114).optional(),
    toAyah: z.coerce.number().int().min(1),
    rating: z.enum(["EXCELLENT", "VERY_GOOD", "GOOD", "ACCEPTABLE", "WEAK"]).optional(),
  })
  .refine(
    (data) => {
      const sameSurah = data.toSurahNumber == null || data.toSurahNumber === data.surahNumber;
      const toSurahNumber = sameSurah ? data.surahNumber : data.toSurahNumber!;

      // رقم آية النهاية دائماً مطلوب ويجب أن يكون ضمن حدود سورته
      if (!isValidAyahNumber(toSurahNumber, data.toAyah)) return false;

      // رقم آية المطلع اختياري؛ إن وُجد يُتحقق ضمن حدود سورة المطلع، وإن كان المقطع ضمن سورة واحدة
      // يجب ألا يتجاوز آية النهاية
      if (data.fromAyah != null) {
        if (!isValidAyahNumber(data.surahNumber, data.fromAyah)) return false;
        if (sameSurah && data.fromAyah > data.toAyah) return false;
      }

      return true;
    },
    { message: "رقم الآية غير صحيح لهذه السورة", path: ["toAyah"] }
  );

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
      fromAyah: item.fromAyah ?? null,
      fromText: item.fromAyah == null && item.fromText ? item.fromText : null,
      toSurahNumber: item.toSurahNumber && item.toSurahNumber !== item.surahNumber ? item.toSurahNumber : null,
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

  // لجلسات الحفظ الجديد نفترض أن المقطع ضمن سورة واحدة عادةً، لكن نتعامل بأمان مع toSurahNumber إن وُجد
  const endSurahNumber = lastItem.toSurahNumber ?? lastItem.surahNumber;
  let nextSurah = endSurahNumber;
  let nextAyah = lastItem.toAyah + 1;
  const surah = getSurah(endSurahNumber);
  if (surah && nextAyah > surah.totalAyahs) {
    nextSurah = endSurahNumber < 114 ? endSurahNumber + 1 : 1;
    nextAyah = 1;
  }

  return {
    last: {
      date: last.date,
      surahNumber: lastItem.surahNumber,
      fromAyah: lastItem.fromAyah,
      fromText: lastItem.fromText,
      toSurahNumber: lastItem.toSurahNumber,
      toAyah: lastItem.toAyah,
    },
    next: { surahNumber: nextSurah, ayah: nextAyah },
  };
}
