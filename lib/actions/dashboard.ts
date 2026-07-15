"use server";

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { requireSession, accessibleCircleIds } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { circles, students, attendanceRecords, memorizationSessions, users } from "@/lib/db/schema";

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function getDashboardStats() {
  const session = await requireSession();
  const ids = await accessibleCircleIds();
  const cutoff = daysAgo(30);

  const circleRows = ids === null ? await db.select().from(circles) : await db.select().from(circles).where(inArray(circles.id, ids.length ? ids : [-1]));

  const circleIds = circleRows.map((c) => c.id);

  const studentRows = circleIds.length
    ? await db.select().from(students).where(inArray(students.circleId, circleIds))
    : [];

  const teacherCount =
    session.user.role === "SUPER_ADMIN"
      ? (await db.select({ id: users.id }).from(users).where(eq(users.role, "TEACHER"))).length
      : undefined;

  const studentIds = studentRows.map((s) => s.id);

  let attendanceRate = 0;
  if (studentIds.length) {
    const records = await db
      .select({ status: attendanceRecords.status })
      .from(attendanceRecords)
      .where(and(inArray(attendanceRecords.studentId, studentIds), gte(attendanceRecords.date, cutoff)));
    if (records.length) {
      const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      attendanceRate = Math.round((present / records.length) * 100);
    }
  }

  const circleProgress: { circleId: number; circleName: string; sessionsCount: number }[] = [];
  if (studentIds.length) {
    const sessions = await db
      .select({ studentId: memorizationSessions.studentId, count: sql<number>`count(*)` })
      .from(memorizationSessions)
      .where(
        and(
          inArray(memorizationSessions.studentId, studentIds),
          eq(memorizationSessions.sessionType, "NEW"),
          gte(memorizationSessions.date, cutoff)
        )
      )
      .groupBy(memorizationSessions.studentId);

    for (const circle of circleRows) {
      const circleStudentIds = new Set(studentRows.filter((s) => s.circleId === circle.id).map((s) => s.id));
      const sessionsCount = sessions
        .filter((s) => circleStudentIds.has(s.studentId))
        .reduce((sum, s) => sum + Number(s.count), 0);
      circleProgress.push({ circleId: circle.id, circleName: circle.name, sessionsCount });
    }
  }

  return {
    teacherCount,
    circleCount: circleRows.length,
    studentCount: studentRows.length,
    attendanceRate,
    circleProgress,
  };
}
