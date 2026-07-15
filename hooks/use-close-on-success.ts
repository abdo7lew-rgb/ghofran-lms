"use client";

import { useState } from "react";

/** يغلق الحوار تلقائياً عند نجاح إجراء الخادم، دون استخدام useEffect (تعديل الحالة أثناء العرض مباشرة). */
export function useCloseOnSuccess<T extends { success?: boolean }>(
  state: T,
  setOpen: (open: boolean) => void
) {
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setOpen(false);
  }
}
