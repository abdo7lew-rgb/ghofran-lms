"use client";

import { TeacherDialog } from "@/components/teachers/teacher-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteTeacherAction } from "@/lib/actions/teachers";

type Teacher = { id: number; name: string; email: string };

export function TeacherRowActions({ teacher }: { teacher: Teacher }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <TeacherDialog teacher={teacher} />
      <ConfirmDeleteButton
        title={`حذف المدرس ${teacher.name}`}
        description="سيتم حذف حساب المدرس. ستبقى حلقاته وطلبته موجودين لكن بدون مدرس مسؤول حتى يتم إسناد مدرس جديد."
        onConfirm={() => deleteTeacherAction(teacher.id)}
      />
    </div>
  );
}
