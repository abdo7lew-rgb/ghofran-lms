"use server";

import { and, eq, gte, inArray, lte, type AnyColumn } from "drizzle-orm";
import { requireSession, requireSuperAdmin, assertStudentAccess, assertCircleAccess } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { students, circles, users, attendanceRecords, memorizationSessions } from "@/lib/db/schema";
import { formatAyahRange } from "@/lib/quran/surahs";

function dateFilter(column: AnyColumn, from?: string, to?: string) {
  const conditions = [];
  if (from) conditions.push(gte(column, from));
  if (to) conditions.push(lte(column, to));
  return conditions;
}

export async function getStudentReport(studentId: number, from?: string, to?: string) {
  await assertStudentAccess(studentId);

  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return null;
  const [circle] = await db.select().from(circles).where(eq(circles.id, student.circleId)).limit(1);

  const attendance = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.studentId, studentId), ...dateFilter(attendanceRecords.date, from, to)))
    .orderBy(attendanceRecords.date);

  const memorization = await db
    .select()
    .from(memorizationSessions)
    .where(and(eq(memorizationSessions.studentId, studentId), ...dateFilter(memorizationSessions.date, from, to)))
    .orderBy(memorizationSessions.date);

  const presentCount = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : null;

  return {
    student,
    circleName: circle?.name ?? "",
    attendance,
    memorization: memorization.map((m) => ({ ...m, positionText: formatAyahRange(m.surahNumber, m.fromAyah, m.toAyah) })),
    attendanceRate,
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

  const attendance = studentIds.length
    ? await db
        .select()
        .from(attendanceRecords)
        .where(and(inArray(attendanceRecords.studentId, studentIds), ...dateFilter(attendanceRecords.date, from, to)))
    : [];

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

  const attendance = studentIds.length
    ? await db
        .select()
        .from(attendanceRecords)
        .where(and(inArray(attendanceRecords.studentId, studentIds), ...dateFilter(attendanceRecords.date, from, to)))
    : [];

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
