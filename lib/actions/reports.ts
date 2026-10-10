"use server";

import { and, eq, gte, inArray, lte, notExists, type AnyColumn } from "drizzle-orm";
import {
  requireSession,
  requireSuperAdmin,
  assertStudentAccess,
  assertCircleAccess,
  accessibleCircleIds,
} from "@/lib/auth/guards";
import { matchesSearch } from "@/lib/search";
import { db } from "@/lib/db";
import {
  students,
  circles,
  circleTeachers,
  users,
  attendanceRecords,
  memorizationSessions,
  memorizationSessionItems,
} from "@/lib/db/schema";
import { summarizeSessionItems } from "@/lib/quran/surahs";
import { isHoliday, listDatesInRange, excludeHolidayRecords } from "@/lib/holidays";
import type { AttendanceStatus } from "@/lib/actions/attendance";
import type { SessionType } from "@/lib/actions/memorization";
import { MEMORIZATION_GRADE_MAX } from "@/lib/labels";

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

export type DayMemorizationStatus = "MEMORIZED" | "NOT_MEMORIZED" | "REVIEW" | "NOT_RECITED";

export type MemorizationGrade = { score: number; memorizedDays: number };

export type ReportDay = {
  date: string;
  hasRecord: boolean;
  attendanceStatus: AttendanceStatus | null;
  memorization: { sessionType: SessionType; summary: string }[];
  memorizationStatus: DayMemorizationStatus | null;
};

// حافظ = جلسة حفظ جديد بمقطع مقيّم "حافظ" (الوحيدة التي تُحتسب في الدرجة)؛ جلسة حفظ جديد بغير ذلك = لم يحفظ؛
// لا حفظ جديد لكن فيه مراجعة = مراجعة؛ لا شيء = لم يسمع. لا يُحكم على أيام قبل الالتحاق ولا أيام مستقبلية.
function dayStatus(
  date: string,
  joinDate: string,
  memorizedDates: Set<string>,
  sessionTypes: SessionType[]
): DayMemorizationStatus | null {
  if (memorizedDates.has(date)) return "MEMORIZED";
  if (sessionTypes.includes("NEW")) return "NOT_MEMORIZED";
  if (sessionTypes.includes("REVIEW")) return "REVIEW";
  if (date < joinDate || date > today()) return null;
  return "NOT_RECITED";
}

/** الدرجة الشهرية: عدد أيام الحفظ في الشهر، بحد أقصى ١٦ (٤ أيام أسبوعياً × ٤ أسابيع) */
function monthlyGrade(memorizedDates: Set<string> | undefined): MemorizationGrade {
  const memorizedDays = memorizedDates?.size ?? 0;
  return { score: Math.min(memorizedDays, MEMORIZATION_GRADE_MAX), memorizedDays };
}

/** لكل طالب: التواريخ التي فيها جلسة حفظ جديد بمقطع مقيّم "حافظ"، والطالب غير مسجّل غائباً ذلك اليوم */
async function loadMemorizedDates(studentIds: number[], from?: string, to?: string) {
  const result = new Map<number, Set<string>>();
  if (!studentIds.length) return result;
  const rows = await db
    .selectDistinct({ studentId: memorizationSessions.studentId, date: memorizationSessions.date })
    .from(memorizationSessions)
    .innerJoin(memorizationSessionItems, eq(memorizationSessionItems.sessionId, memorizationSessions.id))
    .where(
      and(
        inArray(memorizationSessions.studentId, studentIds),
        eq(memorizationSessions.sessionType, "NEW"),
        eq(memorizationSessionItems.rating, "MEMORIZED"),
        ...dateFilter(memorizationSessions.date, from, to),
        notExists(
          db
            .select({ id: attendanceRecords.id })
            .from(attendanceRecords)
            .where(
              and(
                eq(attendanceRecords.studentId, memorizationSessions.studentId),
                eq(attendanceRecords.date, memorizationSessions.date),
                inArray(attendanceRecords.status, ["ABSENT", "EXCUSED"])
              )
            )
        )
      )
    );
  for (const r of rows) {
    const set = result.get(r.studentId) ?? new Set<string>();
    set.add(r.date);
    result.set(r.studentId, set);
  }
  return result;
}

export type DailySummaryRow = {
  studentId: number;
  fullName: string;
  circleName: string;
  status: DayMemorizationStatus;
  attendanceStatus: AttendanceStatus | null;
  sessions: { sessionType: SessionType; summary: string }[];
};

/** المحصلة اليومية: حالة كل طالب (حافظ/لم يحفظ/مراجعة/لم يسمع) في يوم واحد، بنفس منطق التقارير */
export async function getDailySummary(date: string, circleId?: number, query?: string): Promise<DailySummaryRow[]> {
  await requireSession();
  const ids = await accessibleCircleIds();
  let circleRows =
    ids === null
      ? await db.select().from(circles)
      : ids.length
        ? await db.select().from(circles).where(inArray(circles.id, ids))
        : [];
  if (circleId) circleRows = circleRows.filter((c) => c.id === circleId);
  if (!circleRows.length) return [];
  const circleNames = new Map(circleRows.map((c) => [c.id, c.name]));

  const roster = (await db.select().from(students).where(inArray(students.circleId, [...circleNames.keys()])))
    .filter((s) => s.joinDate <= date && (!query || matchesSearch(s.fullName, query)))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
  if (!roster.length) return [];
  const studentIds = roster.map((s) => s.id);

  const [attendance, sessions, memorized] = await Promise.all([
    db
      .select()
      .from(attendanceRecords)
      .where(and(inArray(attendanceRecords.studentId, studentIds), eq(attendanceRecords.date, date))),
    db
      .select()
      .from(memorizationSessions)
      .where(and(inArray(memorizationSessions.studentId, studentIds), eq(memorizationSessions.date, date))),
    loadMemorizedDates(studentIds, date, date),
  ]);
  const items = sessions.length
    ? await db
        .select()
        .from(memorizationSessionItems)
        .where(inArray(memorizationSessionItems.sessionId, sessions.map((s) => s.id)))
    : [];
  const attendanceByStudent = new Map(attendance.map((a) => [a.studentId, a.status as AttendanceStatus]));

  return roster.flatMap((s) => {
    const own = sessions.filter((x) => x.studentId === s.id);
    const status = dayStatus(
      date,
      s.joinDate,
      memorized.get(s.id) ?? new Set<string>(),
      own.map((x) => x.sessionType as SessionType)
    );
    if (!status) return [];
    return [
      {
        studentId: s.id,
        fullName: s.fullName,
        circleName: circleNames.get(s.circleId) ?? "",
        status,
        attendanceStatus: attendanceByStudent.get(s.id) ?? null,
        sessions: own.map((x) => ({
          sessionType: x.sessionType as SessionType,
          summary: summarizeSessionItems(items.filter((i) => i.sessionId === x.id)),
        })),
      },
    ];
  });
}

export async function getStudentReport(studentId: number, from?: string, to?: string, monthly = false) {
  await assertStudentAccess(studentId);

  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return null;
  const [circle] = await db.select().from(circles).where(eq(circles.id, student.circleId)).limit(1);
  const teacherRows = await db
    .select({ name: users.name })
    .from(circleTeachers)
    .innerJoin(users, eq(circleTeachers.teacherId, users.id))
    .where(eq(circleTeachers.circleId, student.circleId));

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

  const memorizedDates = (await loadMemorizedDates([studentId], effectiveFrom, effectiveTo)).get(studentId) ?? new Set<string>();
  const memorizationGrade = monthly ? monthlyGrade(memorizedDates) : null;

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
        memorizationStatus: dayStatus(
          date,
          student.joinDate,
          memorizedDates,
          memo.map((m) => m.sessionType)
        ),
      };
    });

  return {
    student,
    circleName: circle?.name ?? "",
    teacherNames: teacherRows.map((t) => t.name),
    from: effectiveFrom,
    to: effectiveTo,
    attendance,
    memorization,
    attendanceRate,
    memorizationGrade,
    days,
  };
}

export async function getCircleReport(circleId: number, from?: string, to?: string, monthly = false) {
  await assertCircleAccess(circleId);

  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  if (!circle) return null;
  const teacherRows = await db
    .select({ id: users.id, name: users.name })
    .from(circleTeachers)
    .innerJoin(users, eq(circleTeachers.teacherId, users.id))
    .where(eq(circleTeachers.circleId, circleId));

  const roster = await db.select().from(students).where(eq(students.circleId, circleId));
  const studentIds = roster.map((s) => s.id);

  const attendanceRaw = studentIds.length
    ? await db
        .select()
        .from(attendanceRecords)
        .where(and(inArray(attendanceRecords.studentId, studentIds), ...dateFilter(attendanceRecords.date, from, to)))
    : [];
  const attendance = excludeHolidayRecords(attendanceRaw);

  const memorizedByStudent = monthly ? await loadMemorizedDates(studentIds, from, to) : null;

  const perStudent = roster.map((student) => {
    const studentAttendance = attendance.filter((a) => a.studentId === student.id);
    const present = studentAttendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    return {
      studentId: student.id,
      fullName: student.fullName,
      attendanceRate: studentAttendance.length ? Math.round((present / studentAttendance.length) * 100) : null,
      memorizationGrade: memorizedByStudent ? monthlyGrade(memorizedByStudent.get(student.id)) : null,
    };
  });

  const totalPresent = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;

  return {
    circle,
    teacherNames: teacherRows.map((t) => t.name),
    studentCount: roster.length,
    attendanceRate: attendance.length ? Math.round((totalPresent / attendance.length) * 100) : null,
    averageMemorizationGrade: averageScore(perStudent.map((s) => s.memorizationGrade)),
    perStudent,
  };
}

function averageScore(grades: (MemorizationGrade | null)[]): number | null {
  const scores = grades.filter((g): g is MemorizationGrade => g !== null).map((g) => g.score);
  return scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
}

export async function getTeacherReport(teacherId: number, from?: string, to?: string, monthly = false) {
  await requireSuperAdmin();

  const [teacher] = await db.select().from(users).where(eq(users.id, teacherId)).limit(1);
  if (!teacher) return null;

  const circleRows = await db
    .select({ id: circles.id, name: circles.name })
    .from(circleTeachers)
    .innerJoin(circles, eq(circleTeachers.circleId, circles.id))
    .where(eq(circleTeachers.teacherId, teacherId));
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

  const totalPresent = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;

  const memorizedByStudent = monthly ? await loadMemorizedDates(studentIds, from, to) : null;

  return {
    teacher,
    circles: circleRows.map((c) => c.name),
    studentCount: roster.length,
    attendanceRate: attendance.length ? Math.round((totalPresent / attendance.length) * 100) : null,
    averageMemorizationGrade: memorizedByStudent
      ? averageScore(roster.map((s) => monthlyGrade(memorizedByStudent.get(s.id))))
      : null,
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
