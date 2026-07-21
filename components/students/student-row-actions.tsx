"use client";

import { StudentDialog } from "@/components/students/student-dialog";
import { TransferStudentDialog } from "@/components/students/transfer-student-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteStudentAction } from "@/lib/actions/students";

type Student = {
  id: number;
  fullName: string;
  age: number | null;
  guardianName: string | null;
  guardianPhone: string | null;
  circleId: number;
  circleName?: string;
  joinDate: string;
  notes: string | null;
};
type CircleOption = { id: number; name: string };

export function StudentRowActions({ student, circleOptions }: { student: Student; circleOptions: CircleOption[] }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <TransferStudentDialog
        studentId={student.id}
        studentName={student.fullName}
        currentCircleId={student.circleId}
        currentCircleName={
          student.circleName ?? circleOptions.find((c) => c.id === student.circleId)?.name ?? ""
        }
        circleOptions={circleOptions}
      />
      <StudentDialog student={student} circleOptions={circleOptions} />
      <ConfirmDeleteButton
        title={`حذف الطالب ${student.fullName}`}
        description="سيتم حذف بيانات الطالب وكل سجلات حضوره وحفظه نهائياً. هذا الإجراء لا يمكن التراجع عنه."
        onConfirm={() => deleteStudentAction(student.id)}
      />
    </div>
  );
}
