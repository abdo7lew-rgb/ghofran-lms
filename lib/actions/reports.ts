"use server";

import { and, eq, gte, inArray, lte, type AnyColumn } from "drizzle-orm";
import { requireSession, requireSuperAdmin, assertStudentAccess, assertCircleAccess } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { students, circles, users, attendanceRecords, memorizationSessions, memorizationSessionItems } from "@/lib/db/schema";
import { summarizeSessionItems } from "@/lib/quran/surahs";
import { isHoliday, listDatesInRange, excludeHolidayRecords } from "@/lib/holidays";
import type { AttendanceStatus } from "@/lib/actions/attendance";
import type { SessionType } from "@/lib/actions/memorization";

function dateFilter(column: AnyColumn, from?: string, to?: string) {
  const conditions = [];
  if (from) conditions.push(gte(column, from));
  if (to) conditions.push(lte(column, to));
  return conditions;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBefore(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}

export type ReportDay = {
  date: string;
  hasRecord: boolean;
  attendanceStatus: AttendanceStatus | null;
  memorization: { sessionType: SessionType; summary: string }[];
};

export async function getStudentReport(studentId: number, from?: string, to?: string) {
  await assertStudentAccess(studentId);

  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return null;
  const [circle] = await db.select().from(circles).where(eq(circles.id, student.circleId)).limit(1);

  // إذا لم تُحدَّد فترة، نستخدم آخر ٣٠ يوماً كافتراض حتى يمكن بناء قائمة الأيام
  const effectiveTo = to || today();
  const effectiveFrom = from || daysBefore(effectiveTo, 30);

  const attendance = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.studentId, studentId), ...dateFilter(attendanceRecords.date, effectiveFrom, effectiveTo)))
    .orderBy(attendanceRecords.date);

  const sessions = await db
    .select()
    .from(memorizationSessions)
    .where(and(eq(memorizationSessions.studentId, studentId), ...dateFilter(memorizationSessions.date, effectiveFrom, effectiveTo)))
    .orderBy(memorizationSessions.date);

  const items = sessions.length
    ? await db
        .select()
        .from(memorizationSessionItems)
        .where(inArray(memorizationSessionItems.sessionId, sessions.map((s) => s.id)))
    : [];
  const itemsBySession = new Map<number, typeof items>();
  for (const item of items) {
    const list = itemsBySession.get(item.sessionId) ?? [];
    list.push(item);
    itemsBySession.set(item.sessionId, list);
  }

  const memorization = sessions.map((s) => ({
    ...s,
    items: itemsBySession.get(s.id) ?? [],
    positionText: summarizeSessionItems(itemsBySession.get(s.id) ?? []),
  }));

  // نسبة الحضور: تُحسب فقط من الأيام التي فيها سجل حضور فعلي، مع استبعاد أيام العطلة دفاعياً
  const attendanceForRate = excludeHolidayRecords(attendance);
  const presentCount = attendanceForRate.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = attendanceForRate.length ? Math.round((presentCount / attendanceForRate.length) * 100) : null;

  // بناء قائمة الأيام للتقرير: يوم فيه تسجيل فعلي يظهر بكامل تفاصيله، يوم عادي بدون تسجيل يظهر "غائب"،
  // وأيام العطلة (الخميس والجمعة) لا تظهر إطلاقاً ولا تُحتسب
  const attendanceByDate = new Map(attendance.map((a) => [a.date, a]));
  const memorizationByDate = new Map<string, { sessionType: SessionType; summary: string }[]>();
  for (const m of memorization) {
    const list = memorizationByDate.get(m.date) ?? [];
    list.push({ sessionType: m.sessionType as SessionType, summary: m.positionText });
    memorizationByDate.set(m.date, list);
  }

  const days: ReportDay[] = listDatesInRange(effectiveFrom, effectiveTo)
    .filter((date) => !isHoliday(date))
    .map((date) => {
      const att = attendanceByDate.get(date);
      const memo = memorizationByDate.get(date) ?? [];
      return {
        date,
        hasRecord: Boolean(att) || memo.length > 0,
        attendanceStatus: (att?.status as AttendanceStatus) ?? null,
        memorization: memo,
      };
    });

  return {
    student,
    circleName: circle?.name ?? "",
    from: effectiveFrom,
    to: effectiveTo,
    attendance,
    memorization,
    attendanceRate,
    days,
  };
}

export async function getCircleReport(circleId: number, from?: string, to?: string) {
  await assertCircleAccess(circleId);

  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  if (!circle) return null;
  const teacher = circle.teacherId
    ? (await db.select().from(users).where(eq(users.id, circle.teacherId)).limit(1))[0]
    : null;

  const roster = await db.select().from(students).where(eq(students.circleId, circleId));
  const studentIds = roster.map((s) => s.id);

  const attendanceRaw = studentIds.length
    ? await db
        .select()
        .from(attendanceRecords)
        .where(and(inArray(attendanceRecords.studentId, studentIds), ...dateFilter(attendanceRecords.date, from, to)))
    : [];
  const attendance = excludeHolidayRecords(attendanceRaw);

  const memorization = studentIds.length
    ? await db
        .select()
        .from(memorizationSessions)
        .where(
          and(inArray(memorizationSessions.studentId, studentIds), ...dateFilter(memorizationSessions.date, from, to))
        )
    : [];

  const perStudent = roster.map((student) => {
    const studentAttendance = attendance.filter((a) => a.studentId === student.id);
    const present = studentAttendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const studentMemorization = memorization.filter((m) => m.studentId === student.id && m.sessionType === "NEW");
    return {
      studentId: student.id,
      fullName: student.fullName,
      attendanceRate: studentAttendance.length ? Math.round((present / studentAttendance.length) * 100) : null,
      newSessionsCount: studentMemorization.length,
    };
  });

  const totalPresent = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;

  return {
    circle,
    teacherName: teacher?.name ?? null,
    studentCount: roster.length,
    attendanceRate: attendance.length ? Math.round((totalPresent / attendance.length) * 100) : null,
    memorizationSessionsCount: memorization.length,
    perStudent,
  };
}

export async function getTeacherReport(teacherId: number, from?: string, to?: string) {
  await requireSuperAdmin();

  const [teacher] = await db.select().from(users).where(eq(users.id, teacherId)).limit(1);
  if (!teacher) return null;

  const circleRows = await db.select().from(circles).where(eq(circles.teacherId, teacherId));
  const circleIds = circleRows.map((c) => c.id);
  const roster = circleIds.length
    ? await db.select().from(students).where(inArray(students.circleId, circleIds))
    : [];
  const studentIds = roster.map((s) => s.id);

  const attendanceRaw = studentIds.length
    ? await db
        .select()
        .from(attendanceRecords)
        .where(and(inArray(attendanceRecords.studentId, studentIds), ...dateFilter(attendanceRecords.date, from, to)))
    : [];
  const attendance = excludeHolidayRecords(attendanceRaw);

  const memorization = studentIds.length
    ? await db
        .select()
        .from(memorizationSessions)
        .where(
          and(inArray(memorizationSessions.studentId, studentIds), ...dateFilter(memorizationSessions.date, from, to))
        )
    : [];

  const totalPresent = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;

  return {
    teacher,
    circles: circleRows.map((c) => c.name),
    studentCount: roster.length,
    attendanceRate: attendance.length ? Math.round((totalPresent / attendance.length) * 100) : null,
    memorizationSessionsCount: memorization.length,
  };
}

export async function listReportTargets() {
  const session = await requireSession();
  const [studentsList, circlesList, teachersList] = await Promise.all([
    (await import("@/lib/actions/students")).listStudents(),
    (await import("@/lib/actions/circles")).listMyCircles(),
    session.user.role === "SUPER_ADMIN"
      ? db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "TEACHER"))
      : Promise.resolve([]),
  ]);
  return { students: studentsList, circles: circlesList, teachers: teachersList };
}
