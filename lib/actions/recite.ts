"use server";

import { and, asc, eq, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertCircleAccess, assertStudentAccess, requireSuperAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { attendanceRecords, memorizationSessionItems, memorizationSessions, students } from "@/lib/db/schema";
import { isHoliday } from "@/lib/holidays";
import { isActiveStudent } from "@/lib/db/filters";
import { isValidAyahNumber, summarizeSessionItems } from "@/lib/quran/surahs";
import { suggestNextPortion, type NextSuggestion, type PastPortion } from "@/lib/quran/next-session";
import type { AttendanceStatus } from "@/lib/actions/attendance";
import type { SessionType } from "@/lib/actions/memorization";

export type ReciteSession = {
  id: number;
  sessionType: SessionType;
  result: "MEMORIZED" | "NOT_MEMORIZED" | null;
  summary: string;
};

export type ReciteRow = {
  studentId: number;
  fullName: string;
  attendance: AttendanceStatus | null;
  sessions: ReciteSession[];
  suggestion: NextSuggestion | null;
};

/** بيانات شاشة التسميع لحلقة في يوم: حالة كل طالب واقتراح مقطعه القادم (من الجلسات السابقة لذلك اليوم فقط) */
export async function getReciteBoard(circleId: number, date: string): Promise<ReciteRow[]> {
  await requireSuperAdmin(); // شاشة التسميع تجريبية للشيخ المشرف فقط
  await assertCircleAccess(circleId);
  const roster = (await db.select().from(students).where(and(eq(students.circleId, circleId), isActiveStudent)))
    .filter((s) => s.joinDate <= date)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
  if (!roster.length) return [];
  const ids = roster.map((s) => s.id);

  const [attendance, todays, history] = await Promise.all([
    db
      .select()
      .from(attendanceRecords)
      .where(and(inArray(attendanceRecords.studentId, ids), eq(attendanceRecords.date, date))),
    db
      .select()
      .from(memorizationSessions)
      .where(and(inArray(memorizationSessions.studentId, ids), eq(memorizationSessions.date, date))),
    db
      .select({
        studentId: memorizationSessions.studentId,
        surahNumber: memorizationSessionItems.surahNumber,
        fromAyah: memorizationSessionItems.fromAyah,
        toSurahNumber: memorizationSessionItems.toSurahNumber,
        toAyah: memorizationSessionItems.toAyah,
        rating: memorizationSessionItems.rating,
      })
      .from(memorizationSessionItems)
      .innerJoin(memorizationSessions, eq(memorizationSessionItems.sessionId, memorizationSessions.id))
      .where(
        and(
          inArray(memorizationSessions.studentId, ids),
          eq(memorizationSessions.sessionType, "NEW"),
          lt(memorizationSessions.date, date)
        )
      )
      .orderBy(
        asc(memorizationSessions.date),
        asc(memorizationSessions.id),
        asc(memorizationSessionItems.sortOrder),
        asc(memorizationSessionItems.id)
      ),
  ]);

  const todaysItems = todays.length
    ? await db
        .select()
        .from(memorizationSessionItems)
        .where(inArray(memorizationSessionItems.sessionId, todays.map((s) => s.id)))
    : [];

  const historyByStudent = new Map<number, PastPortion[]>();
  for (const h of history) {
    if (h.fromAyah == null || h.toAyah == null) continue;
    if (h.toSurahNumber != null && h.toSurahNumber !== h.surahNumber) continue;
    const list = historyByStudent.get(h.studentId) ?? [];
    list.push({
      surahNumber: h.surahNumber,
      fromAyah: h.fromAyah,
      toAyah: h.toAyah,
      memorized: h.rating === "MEMORIZED" ? true : h.rating === "NOT_MEMORIZED" ? false : null,
    });
    historyByStudent.set(h.studentId, list);
  }
  const attendanceByStudent = new Map(attendance.map((a) => [a.studentId, a.status as AttendanceStatus]));

  return roster.map((s) => ({
    studentId: s.id,
    fullName: s.fullName,
    attendance: attendanceByStudent.get(s.id) ?? null,
    sessions: todays
      .filter((x) => x.studentId === s.id)
      .map((x) => {
        const items = todaysItems.filter((i) => i.sessionId === x.id);
        return {
          id: x.id,
          sessionType: x.sessionType as SessionType,
          result: items.some((i) => i.rating === "MEMORIZED")
            ? "MEMORIZED"
            : items.some((i) => i.rating === "NOT_MEMORIZED")
              ? "NOT_MEMORIZED"
              : null,
          summary: summarizeSessionItems(items),
        };
      }),
    suggestion: suggestNextPortion(historyByStudent.get(s.id) ?? []),
  }));
}

/** ما يلزم للتراجع عن ضغطة: الجلسة المُنشأة (إن وُجدت) وحالة الحضور قبل الضغطة */
export type UndoToken = {
  studentId: number;
  date: string;
  sessionId: number | null;
  attendanceChanged: boolean;
  previousAttendance: AttendanceStatus | null;
};

type ActionResult = { ok: true; undo: UndoToken } | { ok: false; error: string };

async function setAttendance(studentId: number, date: string, status: AttendanceStatus, recordedBy: number) {
  const [existing] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.studentId, studentId), eq(attendanceRecords.date, date)))
    .limit(1);
  const previous = (existing?.status as AttendanceStatus | undefined) ?? null;
  if (previous === status) return { changed: false, previous };
  await db
    .insert(attendanceRecords)
    .values({ studentId, date, status, recordedBy })
    .onConflictDoUpdate({
      target: [attendanceRecords.studentId, attendanceRecords.date],
      set: { status, recordedBy },
    });
  return { changed: true, previous };
}

/** ضغطة "حافظ" أو "لم يحفظ": تسجّل جلسة حفظ جديد بالمقطع، وتسجّل الطالب حاضراً إن لم يكن حاضراً أو متأخراً */
export async function quickRecordAction(input: {
  studentId: number;
  date: string;
  rating: "MEMORIZED" | "NOT_MEMORIZED";
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
}): Promise<ActionResult> {
  const { studentId, date, rating, surahNumber, fromAyah, toAyah } = input;
  if (isHoliday(date)) return { ok: false, error: "لا يوجد تسميع في يوم عطلة" };
  if (!isValidAyahNumber(surahNumber, fromAyah) || !isValidAyahNumber(surahNumber, toAyah) || fromAyah > toAyah) {
    return { ok: false, error: "رقم الآية غير صحيح لهذه السورة" };
  }
  await requireSuperAdmin(); // تجريبية للشيخ المشرف فقط
  const session = await assertStudentAccess(studentId);
  const recordedBy = Number(session.user.id);

  const [inserted] = await db
    .insert(memorizationSessions)
    .values({ studentId, date, sessionType: "NEW", recordedBy })
    .returning({ id: memorizationSessions.id });
  await db
    .insert(memorizationSessionItems)
    .values({ sessionId: inserted.id, surahNumber, fromAyah, toAyah, rating, sortOrder: 0 });

  const [current] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.studentId, studentId), eq(attendanceRecords.date, date)))
    .limit(1);
  const alreadyPresent = current?.status === "PRESENT" || current?.status === "LATE";
  const att = alreadyPresent
    ? { changed: false, previous: current.status as AttendanceStatus }
    : await setAttendance(studentId, date, "PRESENT", recordedBy);

  revalidatePath("/recite");
  revalidatePath("/memorization");
  return {
    ok: true,
    undo: { studentId, date, sessionId: inserted.id, attendanceChanged: att.changed, previousAttendance: att.previous },
  };
}

/** ضغطة "غائب" أو "بإذن": تسجّل الحضور فقط دون جلسة */
export async function markAbsentAction(input: {
  studentId: number;
  date: string;
  status: "ABSENT" | "EXCUSED";
}): Promise<ActionResult> {
  if (isHoliday(input.date)) return { ok: false, error: "لا يُسجَّل حضور في يوم عطلة" };
  await requireSuperAdmin(); // تجريبية للشيخ المشرف فقط
  const session = await assertStudentAccess(input.studentId);
  const att = await setAttendance(input.studentId, input.date, input.status, Number(session.user.id));
  revalidatePath("/recite");
  revalidatePath("/attendance");
  return {
    ok: true,
    undo: {
      studentId: input.studentId,
      date: input.date,
      sessionId: null,
      attendanceChanged: att.changed,
      previousAttendance: att.previous,
    },
  };
}

/** يتراجع عن آخر ضغطة: يحذف الجلسة التي أنشأتها ويعيد الحضور كما كان */
export async function undoQuickAction(token: UndoToken): Promise<{ ok: boolean }> {
  await requireSuperAdmin(); // تجريبية للشيخ المشرف فقط
  const session = await assertStudentAccess(token.studentId);
  if (token.sessionId != null) {
    const [own] = await db
      .select({ id: memorizationSessions.id })
      .from(memorizationSessions)
      .where(and(eq(memorizationSessions.id, token.sessionId), eq(memorizationSessions.studentId, token.studentId)))
      .limit(1);
    if (own) {
      // حذف المقاطع صراحةً بدل الاعتماد على تفعيل foreign_keys في SQLite
      await db.delete(memorizationSessionItems).where(eq(memorizationSessionItems.sessionId, own.id));
      await db.delete(memorizationSessions).where(eq(memorizationSessions.id, own.id));
    }
  }
  if (token.attendanceChanged) {
    const where = and(eq(attendanceRecords.studentId, token.studentId), eq(attendanceRecords.date, token.date));
    if (token.previousAttendance === null) {
      await db.delete(attendanceRecords).where(where);
    } else {
      await db
        .update(attendanceRecords)
        .set({ status: token.previousAttendance, recordedBy: Number(session.user.id) })
        .where(where);
    }
  }
  revalidatePath("/recite");
  revalidatePath("/memorization");
  revalidatePath("/attendance");
  return { ok: true };
}
