import "server-only";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circleTeachers, students } from "@/lib/db/schema";

export class AuthError extends Error {}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new AuthError("يجب تسجيل الدخول");
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") {
    throw new AuthError("هذا الإجراء متاح للشيخ الرئيسي فقط");
  }
  return session;
}

/** يتحقق أن المستخدم الحالي مسموح له بالوصول إلى الحلقة المحددة (الشيخ يصل لكل الحلقات، والمدرس فقط الحلقات المسند إليها). */
export async function assertCircleAccess(circleId: number) {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") return session;

  const [membership] = await db
    .select()
    .from(circleTeachers)
    .where(and(eq(circleTeachers.circleId, circleId), eq(circleTeachers.teacherId, Number(session.user.id))))
    .limit(1);

  if (!membership) {
    throw new AuthError("لا تملك صلاحية الوصول لهذه الحلقة");
  }
  return session;
}

/** يتحقق أن المستخدم الحالي مسموح له بالوصول إلى بيانات الطالب المحدد. */
export async function assertStudentAccess(studentId: number) {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") return session;

  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) {
    throw new AuthError("لا تملك صلاحية الوصول لهذا الطالب");
  }

  const [membership] = await db
    .select()
    .from(circleTeachers)
    .where(and(eq(circleTeachers.circleId, student.circleId), eq(circleTeachers.teacherId, Number(session.user.id))))
    .limit(1);

  if (!membership) {
    throw new AuthError("لا تملك صلاحية الوصول لهذا الطالب");
  }
  return session;
}

/** يعيد قائمة معرفات الحلقات التي يملك المستخدم الحالي صلاحية الوصول إليها، أو null إذا كان يصل لكل الحلقات (شيخ). */
export async function accessibleCircleIds(): Promise<number[] | null> {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") return null;

  const rows = await db
    .select({ id: circleTeachers.circleId })
    .from(circleTeachers)
    .where(eq(circleTeachers.teacherId, Number(session.user.id)));
  return rows.map((r) => r.id);
}
