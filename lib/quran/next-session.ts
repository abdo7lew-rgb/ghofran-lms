import { SURAHS } from "@/lib/quran/surahs";

/** مقطع حفظ جديد سابق، بترتيب زمني تصاعدي. memorized: true حافظ، false لم يحفظ، null بدون تقييم */
export type PastPortion = {
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  memorized: boolean | null;
};

export type NextSuggestion = {
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  /** continue: يكمل بعد آخر موضع · cumulative: يعيد من مطلع السورة ويزيد · repeat: يعيد لأنه لم يحفظ · next-surah: انتقل لسورة جديدة */
  mode: "continue" | "cumulative" | "repeat" | "next-surah";
  /** المقدار المعتاد (آيات) المحسوب من آخر الجلسات، أو null إن لم تكفِ البيانات */
  usualAmount: number | null;
};

const RECENT = 5;

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const totalAyahs = (n: number) => SURAHS.find((s) => s.number === n)?.totalAyahs ?? 0;

// تراكمي: آخر مقطعين في نفس السورة يبدآن من نفس الآية والنهاية تزيد (يعيد من المطلع كل مرة)
function isCumulative(a: PastPortion | undefined, b: PastPortion) {
  return !!a && a.surahNumber === b.surahNumber && a.fromAyah === b.fromAyah && b.toAyah > a.toAyah;
}

/**
 * يقترح مقطع الحفظ الجديد القادم من سجل الطالب نفسه: البداية من آخر موضع (أو إعادة إن لم يحفظ)،
 * والنهاية حسب مقداره المعتاد في آخر ٥ جلسات حفظ فيها، دون تجاوز نهاية السورة.
 * اتجاه الانتقال بين السور (تصاعدي/تنازلي) يُستنتج من سجل الطالب، والافتراضي تنازلي (من آخر المصحف).
 */
export function suggestNextPortion(history: PastPortion[]): NextSuggestion | null {
  const last = history[history.length - 1];
  if (!last) return null;
  const prev = history[history.length - 2];
  const cumulative = isCumulative(prev, last);

  const amounts: number[] = [];
  for (let i = history.length - 1; i >= 0 && amounts.length < RECENT; i--) {
    const p = history[i];
    if (p.memorized !== true) continue;
    const before = history[i - 1];
    amounts.push(isCumulative(before, p) ? p.toAyah - before!.toAyah : p.toAyah - p.fromAyah + 1);
  }
  const usualAmount = median(amounts.filter((n) => n > 0));
  const amount = usualAmount ?? Math.max(last.toAyah - last.fromAyah + 1, 1);

  if (last.memorized === false) {
    return { surahNumber: last.surahNumber, fromAyah: last.fromAyah, toAyah: last.toAyah, mode: "repeat", usualAmount };
  }

  const total = totalAyahs(last.surahNumber);
  if (last.toAyah >= total) {
    let up = 0;
    let down = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].surahNumber > history[i - 1].surahNumber) up++;
      else if (history[i].surahNumber < history[i - 1].surahNumber) down++;
    }
    const next = up > down ? last.surahNumber + 1 : last.surahNumber - 1;
    if (next < 1 || next > 114) return null;
    return { surahNumber: next, fromAyah: 1, toAyah: Math.min(amount, totalAyahs(next)), mode: "next-surah", usualAmount };
  }

  if (cumulative) {
    return {
      surahNumber: last.surahNumber,
      fromAyah: last.fromAyah,
      toAyah: Math.min(last.toAyah + amount, total),
      mode: "cumulative",
      usualAmount,
    };
  }

  const fromAyah = last.toAyah + 1;
  return {
    surahNumber: last.surahNumber,
    fromAyah,
    toAyah: Math.min(fromAyah + amount - 1, total),
    mode: "continue",
    usualAmount,
  };
}
