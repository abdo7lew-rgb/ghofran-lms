"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertCircleAccess, assertStudentAccess } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { students, attendanceRecords, circles } from "@/lib/db/schema";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export async function getAttendanceSheet(circleId: number, date: string) {
  await assertCircleAccess(circleId);

  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  const roster = await db.select().from(students).where(eq(students.circleId, circleId));
  const existing = roster.length
    ? await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.date, date),
            inArray(attendanceRecords.studentId, roster.map((s) => s.id))
          )
        )
    : [];

  const statusByStudent = new Map(existing.map((r) => [r.studentId, r.status]));

  return {
    circleName: circle?.name ?? "",
    students: roster
      .map((s) => ({
        id: s.id,
        fullName: s.fullName,
        status: (statusByStudent.get(s.id) ?? "PRESENT") as AttendanceStatus,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar")),
  };
}

export type SaveAttendanceState = { error?: string; success?: boolean };

export async function saveAttendanceAction(
  _prevState: SaveAttendanceState,
  formData: FormData
): Promise<SaveAttendanceState> {
  const circleId = Number(formData.get("circleId"));
  const date = String(formData.get("date") ?? "");
  if (!circleId || !date) return { error: "بيانات غير صحيحة" };

  const session = await assertCircleAccess(circleId);

  const roster = await db.select({ id: students.id }).from(students).where(eq(students.circleId, circleId));
  const rosterIds = new Set(roster.map((s) => s.id));

  const entries: { studentId: number; status: AttendanceStatus }[] = [];
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^status_(\d+)$/);
    if (match) {
      const studentId = Number(match[1]);
      if (rosterIds.has(studentId)) {
        entries.push({ studentId, status: String(value) as AttendanceStatus });
      }
    }
  }

  for (const entry of entries) {
    await db
      .insert(attendanceRecords)
      .values({
        studentId: entry.studentId,
        date,
        status: entry.status,
        recordedBy: Number(session.user.id),
      })
      .onConflictDoUpdate({
        target: [attendanceRecords.studentId, attendanceRecords.date],
        set: { status: entry.status, recordedBy: Number(session.user.id) },
      });
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getStudentAttendanceHistory(studentId: number) {
  await assertStudentAccess(studentId);
  return db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.studentId, studentId))
    .orderBy(desc(attendanceRecords.date));
}
