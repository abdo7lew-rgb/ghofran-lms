"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteMemorizationSessionAction } from "@/lib/actions/memorization";
import { MemorizationDialog, type EditableSession } from "@/components/memorization/memorization-dialog";

type StudentOption = { id: number; fullName: string; circleName: string };

export function MemorizationRowActions({
  session,
  studentId,
  student,
}: {
  session: EditableSession;
  studentId: number;
  /** بيانات الطالب المطلوبة لعرض حوار التعديل (لا حاجة لقائمة كل الطلاب لأن الطالب مُحدَّد سلفاً) */
  student: StudentOption;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <MemorizationDialog students={[student]} defaultStudentId={studentId} session={session} />
      <ConfirmDeleteButton
        title="حذف جلسة الحفظ"
        description="سيتم حذف هذا السجل نهائياً."
        onConfirm={() => deleteMemorizationSessionAction(session.id, studentId)}
      />
    </div>
  );
}
