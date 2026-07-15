"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteMemorizationSessionAction } from "@/lib/actions/memorization";

export function MemorizationRowActions({ id, studentId }: { id: number; studentId: number }) {
  return (
    <ConfirmDeleteButton
      title="حذف جلسة الحفظ"
      description="سيتم حذف هذا السجل نهائياً."
      onConfirm={() => deleteMemorizationSessionAction(id, studentId)}
    />
  );
}
