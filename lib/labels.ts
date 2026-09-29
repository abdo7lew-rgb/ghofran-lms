export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  LATE: "متأخر",
  EXCUSED: "بإذن",
};

export const SESSION_TYPE_LABELS: Record<string, string> = {
  NEW: "حفظ جديد",
  REVIEW: "مراجعة",
};

export const RATING_LABELS: Record<string, string> = {
  MEMORIZED: "حافظ",
  NOT_MEMORIZED: "لم يحفظ",
};

export const MEMORIZATION_GRADE_MAX = 16;

export const DAY_MEMORIZATION_LABELS: Record<string, string> = {
  MEMORIZED: "حافظ",
  NOT_MEMORIZED: "لم يحفظ",
  REVIEW: "مراجعة",
  NOT_RECITED: "لم يسمع",
};

const ORDINALS = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة"];

/** ترتيب الحلقات حسب ترتيبها في الاسم (الأولى، الثانية...) ثم أبجدياً */
export function compareCircleNames(a: string, b: string): number {
  const rank = (n: string) => {
    const i = ORDINALS.findIndex((o) => n.includes(o));
    return i === -1 ? ORDINALS.length : i;
  };
  return rank(a) - rank(b) || a.localeCompare(b, "ar");
}

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export const WEEKDAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** "2026-09" → "سبتمبر 2026" */
export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function gradeVerdict(score: number) {
  const ratio = score / MEMORIZATION_GRADE_MAX;
  if (ratio >= 0.9) return "ممتاز";
  if (ratio >= 0.75) return "جيد جداً";
  if (ratio >= 0.5) return "مقبول";
  return "يحتاج متابعة";
}

export function formatGrade(grade: { score: number } | null): string {
  return grade ? `${grade.score} / ${MEMORIZATION_GRADE_MAX}` : "—";
}
