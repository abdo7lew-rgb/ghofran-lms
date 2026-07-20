"use client";

import { CircleDialog } from "@/components/circles/circle-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteCircleAction } from "@/lib/actions/circles";

type Circle = { id: number; name: string; description: string | null; teacherIds: number[] };
type TeacherOption = { id: number; name: string };

export function CircleRowActions({ circle, teacherOptions }: { circle: Circle; teacherOptions: TeacherOption[] }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <CircleDialog circle={circle} teacherOptions={teacherOptions} />
      <ConfirmDeleteButton
        title={`حذف حلقة ${circle.name}`}
        description="سيتم حذف الحلقة وجميع بيانات طلبتها وسجلات حضورهم وحفظهم نهائياً. هذا الإجراء لا يمكن التراجع عنه."
        onConfirm={() => deleteCircleAction(circle.id)}
      />
    </div>
  );
}
