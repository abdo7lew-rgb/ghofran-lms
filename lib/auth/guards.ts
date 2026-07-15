import "server-only";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circles, students } from "@/lib/db/schema";

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

/** يتحقق أن المستخدم الحالي مسموح له بالوصول إلى الحلقة المحددة (الشيخ يصل لكل الحلقات، المدرس فقط حلقته). */
export async function assertCircleAccess(circleId: number) {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") return session;

  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  if (!circle || circle.teacherId !== Number(session.user.id)) {
    throw new AuthError("لا تملك صلاحية الوصول لهذه الحلقة");
  }
  return session;
}

/** يتحقق أن المستخدم الحالي مسموح له بالوصول إلى بيانات الطالب المحدد. */
export async function assertStudentAccess(studentId: number) {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") return session;

  const [row] = await db
    .select({ teacherId: circles.teacherId })
    .from(students)
    .innerJoin(circles, eq(students.circleId, circles.id))
    .where(eq(students.id, studentId))
    .limit(1);

  if (!row || row.teacherId !== Number(session.user.id)) {
    throw new AuthError("لا تملك صلاحية الوصول لهذا الطالب");
  }
  return session;
}

/** يعيد قائمة معرفات الحلقات التي يملك المستخدم الحالي صلاحية الوصول إليها، أو null إذا كان يصل لكل الحلقات (شيخ). */
export async function accessibleCircleIds(): Promise<number[] | null> {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") return null;

  const rows = await db
    .select({ id: circles.id })
    .from(circles)
    .where(eq(circles.teacherId, Number(session.user.id)));
  return rows.map((r) => r.id);
}
