// توحيد النص العربي للبحث: حذف التشكيل والتطويل وتوحيد الألف والياء والتاء المربوطة والهمزات
export function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/** هل يطابق النص عبارة البحث؟ كل كلمة في البحث يجب أن تظهر في النص (بأي ترتيب) */
export function matchesSearch(text: string, query: string): boolean {
  const q = normalizeArabic(query);
  if (!q) return true;
  const hay = normalizeArabic(text);
  return q.split(" ").every((word) => hay.includes(word));
}
