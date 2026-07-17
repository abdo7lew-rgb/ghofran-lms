// أيام العطلة الأسبوعية الثابتة لكل الحلقات: الخميس والجمعة
// نعتمد على Date.getUTCDay(): الأحد=0 ... الخميس=4 الجمعة=5 السبت=6
export const HOLIDAY_WEEKDAYS = [4, 5] as const;

export const HOLIDAY_LABEL = "عطلة";

/** يحول تاريخاً بصيغة YYYY-MM-DD إلى رقم اليوم في الأسبوع (UTC) بدون مشاكل المنطقة الزمنية */
function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay();
}

/** هل هذا التاريخ يوم عطلة أسبوعية (خميس أو جمعة)؟ */
export function isHoliday(dateStr: string): boolean {
  if (!dateStr) return false;
  return (HOLIDAY_WEEKDAYS as readonly number[]).includes(weekdayOf(dateStr));
}

/** يولّد كل التواريخ (YYYY-MM-DD) بين from وto ضمناً، بترتيب تصاعدي */
export function listDatesInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const start = new Date(Date.UTC(fy, (fm || 1) - 1, fd || 1));
  const end = new Date(Date.UTC(ty, (tm || 1) - 1, td || 1));
  if (start > end) return dates;
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

/** يفلتر مصفوفة سجلات (فيها حقل date) لاستبعاد أيام العطلة، دفاعياً حتى لو وُجدت سجلات قديمة بالخطأ */
export function excludeHolidayRecords<T extends { date: string }>(records: T[]): T[] {
  return records.filter((r) => !isHoliday(r.date));
}
