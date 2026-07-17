export type Surah = {
  number: number;
  nameArabic: string;
  nameTransliteration: string;
  totalAyahs: number;
};

export const SURAHS: Surah[] = [
  { number: 1, nameArabic: "الفاتحة", nameTransliteration: "Al-Fatihah", totalAyahs: 7 },
  { number: 2, nameArabic: "البقرة", nameTransliteration: "Al-Baqarah", totalAyahs: 286 },
  { number: 3, nameArabic: "آل عمران", nameTransliteration: "Aal-E-Imran", totalAyahs: 200 },
  { number: 4, nameArabic: "النساء", nameTransliteration: "An-Nisa", totalAyahs: 176 },
  { number: 5, nameArabic: "المائدة", nameTransliteration: "Al-Ma'idah", totalAyahs: 120 },
  { number: 6, nameArabic: "الأنعام", nameTransliteration: "Al-An'am", totalAyahs: 165 },
  { number: 7, nameArabic: "الأعراف", nameTransliteration: "Al-A'raf", totalAyahs: 206 },
  { number: 8, nameArabic: "الأنفال", nameTransliteration: "Al-Anfal", totalAyahs: 75 },
  { number: 9, nameArabic: "التوبة", nameTransliteration: "At-Tawbah", totalAyahs: 129 },
  { number: 10, nameArabic: "يونس", nameTransliteration: "Yunus", totalAyahs: 109 },
  { number: 11, nameArabic: "هود", nameTransliteration: "Hud", totalAyahs: 123 },
  { number: 12, nameArabic: "يوسف", nameTransliteration: "Yusuf", totalAyahs: 111 },
  { number: 13, nameArabic: "الرعد", nameTransliteration: "Ar-Ra'd", totalAyahs: 43 },
  { number: 14, nameArabic: "إبراهيم", nameTransliteration: "Ibrahim", totalAyahs: 52 },
  { number: 15, nameArabic: "الحجر", nameTransliteration: "Al-Hijr", totalAyahs: 99 },
  { number: 16, nameArabic: "النحل", nameTransliteration: "An-Nahl", totalAyahs: 128 },
  { number: 17, nameArabic: "الإسراء", nameTransliteration: "Al-Isra", totalAyahs: 111 },
  { number: 18, nameArabic: "الكهف", nameTransliteration: "Al-Kahf", totalAyahs: 110 },
  { number: 19, nameArabic: "مريم", nameTransliteration: "Maryam", totalAyahs: 98 },
  { number: 20, nameArabic: "طه", nameTransliteration: "Ta-Ha", totalAyahs: 135 },
  { number: 21, nameArabic: "الأنبياء", nameTransliteration: "Al-Anbya", totalAyahs: 112 },
  { number: 22, nameArabic: "الحج", nameTransliteration: "Al-Hajj", totalAyahs: 78 },
  { number: 23, nameArabic: "المؤمنون", nameTransliteration: "Al-Mu'minun", totalAyahs: 118 },
  { number: 24, nameArabic: "النور", nameTransliteration: "An-Nur", totalAyahs: 64 },
  { number: 25, nameArabic: "الفرقان", nameTransliteration: "Al-Furqan", totalAyahs: 77 },
  { number: 26, nameArabic: "الشعراء", nameTransliteration: "Ash-Shu'ara", totalAyahs: 227 },
  { number: 27, nameArabic: "النمل", nameTransliteration: "An-Naml", totalAyahs: 93 },
  { number: 28, nameArabic: "القصص", nameTransliteration: "Al-Qasas", totalAyahs: 88 },
  { number: 29, nameArabic: "العنكبوت", nameTransliteration: "Al-Ankabut", totalAyahs: 69 },
  { number: 30, nameArabic: "الروم", nameTransliteration: "Ar-Rum", totalAyahs: 60 },
  { number: 31, nameArabic: "لقمان", nameTransliteration: "Luqman", totalAyahs: 34 },
  { number: 32, nameArabic: "السجدة", nameTransliteration: "As-Sajdah", totalAyahs: 30 },
  { number: 33, nameArabic: "الأحزاب", nameTransliteration: "Al-Ahzab", totalAyahs: 73 },
  { number: 34, nameArabic: "سبأ", nameTransliteration: "Saba", totalAyahs: 54 },
  { number: 35, nameArabic: "فاطر", nameTransliteration: "Fatir", totalAyahs: 45 },
  { number: 36, nameArabic: "يس", nameTransliteration: "Ya-Sin", totalAyahs: 83 },
  { number: 37, nameArabic: "الصافات", nameTransliteration: "As-Saffat", totalAyahs: 182 },
  { number: 38, nameArabic: "ص", nameTransliteration: "Sad", totalAyahs: 88 },
  { number: 39, nameArabic: "الزمر", nameTransliteration: "Az-Zumar", totalAyahs: 75 },
  { number: 40, nameArabic: "غافر", nameTransliteration: "Ghafir", totalAyahs: 85 },
  { number: 41, nameArabic: "فصلت", nameTransliteration: "Fussilat", totalAyahs: 54 },
  { number: 42, nameArabic: "الشورى", nameTransliteration: "Ash-Shuraa", totalAyahs: 53 },
  { number: 43, nameArabic: "الزخرف", nameTransliteration: "Az-Zukhruf", totalAyahs: 89 },
  { number: 44, nameArabic: "الدخان", nameTransliteration: "Ad-Dukhan", totalAyahs: 59 },
  { number: 45, nameArabic: "الجاثية", nameTransliteration: "Al-Jathiyah", totalAyahs: 37 },
  { number: 46, nameArabic: "الأحقاف", nameTransliteration: "Al-Ahqaf", totalAyahs: 35 },
  { number: 47, nameArabic: "محمد", nameTransliteration: "Muhammad", totalAyahs: 38 },
  { number: 48, nameArabic: "الفتح", nameTransliteration: "Al-Fath", totalAyahs: 29 },
  { number: 49, nameArabic: "الحجرات", nameTransliteration: "Al-Hujurat", totalAyahs: 18 },
  { number: 50, nameArabic: "ق", nameTransliteration: "Qaf", totalAyahs: 45 },
  { number: 51, nameArabic: "الذاريات", nameTransliteration: "Adh-Dhariyat", totalAyahs: 60 },
  { number: 52, nameArabic: "الطور", nameTransliteration: "At-Tur", totalAyahs: 49 },
  { number: 53, nameArabic: "النجم", nameTransliteration: "An-Najm", totalAyahs: 62 },
  { number: 54, nameArabic: "القمر", nameTransliteration: "Al-Qamar", totalAyahs: 55 },
  { number: 55, nameArabic: "الرحمن", nameTransliteration: "Ar-Rahman", totalAyahs: 78 },
  { number: 56, nameArabic: "الواقعة", nameTransliteration: "Al-Waqi'ah", totalAyahs: 96 },
  { number: 57, nameArabic: "الحديد", nameTransliteration: "Al-Hadid", totalAyahs: 29 },
  { number: 58, nameArabic: "المجادلة", nameTransliteration: "Al-Mujadilah", totalAyahs: 22 },
  { number: 59, nameArabic: "الحشر", nameTransliteration: "Al-Hashr", totalAyahs: 24 },
  { number: 60, nameArabic: "الممتحنة", nameTransliteration: "Al-Mumtahanah", totalAyahs: 13 },
  { number: 61, nameArabic: "الصف", nameTransliteration: "As-Saf", totalAyahs: 14 },
  { number: 62, nameArabic: "الجمعة", nameTransliteration: "Al-Jumu'ah", totalAyahs: 11 },
  { number: 63, nameArabic: "المنافقون", nameTransliteration: "Al-Munafiqun", totalAyahs: 11 },
  { number: 64, nameArabic: "التغابن", nameTransliteration: "At-Taghabun", totalAyahs: 18 },
  { number: 65, nameArabic: "الطلاق", nameTransliteration: "At-Talaq", totalAyahs: 12 },
  { number: 66, nameArabic: "التحريم", nameTransliteration: "At-Tahrim", totalAyahs: 12 },
  { number: 67, nameArabic: "الملك", nameTransliteration: "Al-Mulk", totalAyahs: 30 },
  { number: 68, nameArabic: "القلم", nameTransliteration: "Al-Qalam", totalAyahs: 52 },
  { number: 69, nameArabic: "الحاقة", nameTransliteration: "Al-Haqqah", totalAyahs: 52 },
  { number: 70, nameArabic: "المعارج", nameTransliteration: "Al-Ma'arij", totalAyahs: 44 },
  { number: 71, nameArabic: "نوح", nameTransliteration: "Nuh", totalAyahs: 28 },
  { number: 72, nameArabic: "الجن", nameTransliteration: "Al-Jinn", totalAyahs: 28 },
  { number: 73, nameArabic: "المزمل", nameTransliteration: "Al-Muzzammil", totalAyahs: 20 },
  { number: 74, nameArabic: "المدثر", nameTransliteration: "Al-Muddaththir", totalAyahs: 56 },
  { number: 75, nameArabic: "القيامة", nameTransliteration: "Al-Qiyamah", totalAyahs: 40 },
  { number: 76, nameArabic: "الإنسان", nameTransliteration: "Al-Insan", totalAyahs: 31 },
  { number: 77, nameArabic: "المرسلات", nameTransliteration: "Al-Mursalat", totalAyahs: 50 },
  { number: 78, nameArabic: "النبأ", nameTransliteration: "An-Naba", totalAyahs: 40 },
  { number: 79, nameArabic: "النازعات", nameTransliteration: "An-Nazi'at", totalAyahs: 46 },
  { number: 80, nameArabic: "عبس", nameTransliteration: "Abasa", totalAyahs: 42 },
  { number: 81, nameArabic: "التكوير", nameTransliteration: "At-Takwir", totalAyahs: 29 },
  { number: 82, nameArabic: "الإنفطار", nameTransliteration: "Al-Infitar", totalAyahs: 19 },
  { number: 83, nameArabic: "المطففين", nameTransliteration: "Al-Mutaffifin", totalAyahs: 36 },
  { number: 84, nameArabic: "الإنشقاق", nameTransliteration: "Al-Inshiqaq", totalAyahs: 25 },
  { number: 85, nameArabic: "البروج", nameTransliteration: "Al-Buruj", totalAyahs: 22 },
  { number: 86, nameArabic: "الطارق", nameTransliteration: "At-Tariq", totalAyahs: 17 },
  { number: 87, nameArabic: "الأعلى", nameTransliteration: "Al-A'la", totalAyahs: 19 },
  { number: 88, nameArabic: "الغاشية", nameTransliteration: "Al-Ghashiyah", totalAyahs: 26 },
  { number: 89, nameArabic: "الفجر", nameTransliteration: "Al-Fajr", totalAyahs: 30 },
  { number: 90, nameArabic: "البلد", nameTransliteration: "Al-Balad", totalAyahs: 20 },
  { number: 91, nameArabic: "الشمس", nameTransliteration: "Ash-Shams", totalAyahs: 15 },
  { number: 92, nameArabic: "الليل", nameTransliteration: "Al-Layl", totalAyahs: 21 },
  { number: 93, nameArabic: "الضحى", nameTransliteration: "Ad-Duhaa", totalAyahs: 11 },
  { number: 94, nameArabic: "الشرح", nameTransliteration: "Ash-Sharh", totalAyahs: 8 },
  { number: 95, nameArabic: "التين", nameTransliteration: "At-Tin", totalAyahs: 8 },
  { number: 96, nameArabic: "العلق", nameTransliteration: "Al-Alaq", totalAyahs: 19 },
  { number: 97, nameArabic: "القدر", nameTransliteration: "Al-Qadr", totalAyahs: 5 },
  { number: 98, nameArabic: "البينة", nameTransliteration: "Al-Bayyinah", totalAyahs: 8 },
  { number: 99, nameArabic: "الزلزلة", nameTransliteration: "Az-Zalzalah", totalAyahs: 8 },
  { number: 100, nameArabic: "العاديات", nameTransliteration: "Al-Adiyat", totalAyahs: 11 },
  { number: 101, nameArabic: "القارعة", nameTransliteration: "Al-Qari'ah", totalAyahs: 11 },
  { number: 102, nameArabic: "التكاثر", nameTransliteration: "At-Takathur", totalAyahs: 8 },
  { number: 103, nameArabic: "العصر", nameTransliteration: "Al-Asr", totalAyahs: 3 },
  { number: 104, nameArabic: "الهمزة", nameTransliteration: "Al-Humazah", totalAyahs: 9 },
  { number: 105, nameArabic: "الفيل", nameTransliteration: "Al-Fil", totalAyahs: 5 },
  { number: 106, nameArabic: "قريش", nameTransliteration: "Quraysh", totalAyahs: 4 },
  { number: 107, nameArabic: "الماعون", nameTransliteration: "Al-Ma'un", totalAyahs: 7 },
  { number: 108, nameArabic: "الكوثر", nameTransliteration: "Al-Kawthar", totalAyahs: 3 },
  { number: 109, nameArabic: "الكافرون", nameTransliteration: "Al-Kafirun", totalAyahs: 6 },
  { number: 110, nameArabic: "النصر", nameTransliteration: "An-Nasr", totalAyahs: 3 },
  { number: 111, nameArabic: "المسد", nameTransliteration: "Al-Masad", totalAyahs: 5 },
  { number: 112, nameArabic: "الإخلاص", nameTransliteration: "Al-Ikhlas", totalAyahs: 4 },
  { number: 113, nameArabic: "الفلق", nameTransliteration: "Al-Falaq", totalAyahs: 5 },
  { number: 114, nameArabic: "الناس", nameTransliteration: "An-Nas", totalAyahs: 6 },
];

const SURAH_BY_NUMBER = new Map(SURAHS.map((s) => [s.number, s]));

export function getSurah(number: number): Surah | undefined {
  return SURAH_BY_NUMBER.get(number);
}

export function getSurahName(number: number): string {
  return getSurah(number)?.nameArabic ?? `سورة ${number}`;
}

export function isValidAyahRange(surahNumber: number, fromAyah: number, toAyah: number): boolean {
  const surah = getSurah(surahNumber);
  if (!surah) return false;
  if (fromAyah < 1 || toAyah < 1) return false;
  if (fromAyah > toAyah) return false;
  return toAyah <= surah.totalAyahs;
}

export function formatAyahRange(surahNumber: number, fromAyah: number, toAyah: number): string {
  const name = getSurahName(surahNumber);
  if (fromAyah === toAyah) return `${name}: الآية ${fromAyah}`;
  return `${name}: من الآية ${fromAyah} إلى الآية ${toAyah}`;
}

/** صيغة مختصرة لعرض مقطع ضمن قائمة مقاطع جلسة واحدة، مثال: "البقرة (١-٢٠)" */
export function formatAyahRangeCompact(surahNumber: number, fromAyah: number, toAyah: number): string {
  const name = getSurahName(surahNumber);
  return fromAyah === toAyah ? `${name} (${fromAyah})` : `${name} (${fromAyah}-${toAyah})`;
}

/** يتحقق أن مقطعاً يمتد من سورة (وآية) إلى سورة أخرى لاحقة (وآية) صحيح: ترتيب السور تصاعدي وأرقام الآيات ضمن حدود كل سورة. */
export function isValidSurahSpan(fromSurah: number, fromAyah: number, toSurah: number, toAyah: number): boolean {
  const from = getSurah(fromSurah);
  const to = getSurah(toSurah);
  if (!from || !to) return false;
  if (fromAyah < 1 || fromAyah > from.totalAyahs) return false;
  if (toAyah < 1 || toAyah > to.totalAyahs) return false;
  return toSurah >= fromSurah;
}

type SessionItemLike = {
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  toSurahNumber?: number | null;
};

/** صيغة مختصرة لعرض مقطع قد يمتد عبر أكثر من سورة، مثال: "البقرة (١) ← آل عمران (٢٠٠)" */
export function formatItemRangeCompact(item: SessionItemLike): string {
  const spansMultipleSurahs = item.toSurahNumber != null && item.toSurahNumber !== item.surahNumber;
  if (!spansMultipleSurahs) {
    return formatAyahRangeCompact(item.surahNumber, item.fromAyah, item.toAyah);
  }
  const fromName = getSurahName(item.surahNumber);
  const toName = getSurahName(item.toSurahNumber as number);
  return `${fromName} (${item.fromAyah}) ← ${toName} (${item.toAyah})`;
}

/** يجمع مقاطع الجلسة الواحدة في نص واحد مفصول بفواصل، مثال: "آل عمران (١-٣٠)، النساء (١-٢٠)" */
export function summarizeSessionItems(items: SessionItemLike[]): string {
  if (items.length === 0) return "—";
  return items.map((i) => formatItemRangeCompact(i)).join("، ");
}
