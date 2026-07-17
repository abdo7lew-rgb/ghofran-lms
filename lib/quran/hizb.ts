/**
 * مطالع الأحزاب الستين (٦٠ حزباً) حسب رواية قالون عن نافع.
 * تم اشتقاقها والتحقق منها من نص القرآن الكريم برواية قالون (مصدر: quran-api لـ fawazahmed0،
 * نسخة "ara-quranqaloon")، وقُوبلت أرقام الأجزاء الفردية (بدايات الأجزاء) بمواضعها المعروفة.
 * ملاحظة: بعض المواضع تختلف بمقدار آية أو آيتين عن العدّ المعروف في مصحف حفص، وهذا متوقع
 * وصحيح لأن تقسيم الآيات نفسه يختلف قليلاً بين الروايتين في عدد من السور.
 */
export type HizbStart = {
  hizb: number;
  surahNumber: number;
  ayah: number;
};

export const HIZB_STARTS: HizbStart[] = [
  { hizb: 1, surahNumber: 1, ayah: 1 },
  { hizb: 2, surahNumber: 2, ayah: 26 },
  { hizb: 3, surahNumber: 2, ayah: 142 },
  { hizb: 4, surahNumber: 2, ayah: 203 },
  { hizb: 5, surahNumber: 2, ayah: 253 },
  { hizb: 6, surahNumber: 3, ayah: 15 },
  { hizb: 7, surahNumber: 3, ayah: 92 },
  { hizb: 8, surahNumber: 3, ayah: 171 },
  { hizb: 9, surahNumber: 4, ayah: 24 },
  { hizb: 10, surahNumber: 4, ayah: 87 },
  { hizb: 11, surahNumber: 4, ayah: 148 },
  { hizb: 12, surahNumber: 5, ayah: 23 },
  { hizb: 13, surahNumber: 5, ayah: 82 },
  { hizb: 14, surahNumber: 6, ayah: 36 },
  { hizb: 15, surahNumber: 6, ayah: 111 },
  { hizb: 16, surahNumber: 7, ayah: 1 },
  { hizb: 17, surahNumber: 7, ayah: 88 },
  { hizb: 18, surahNumber: 7, ayah: 171 },
  { hizb: 19, surahNumber: 8, ayah: 41 },
  { hizb: 20, surahNumber: 9, ayah: 34 },
  { hizb: 21, surahNumber: 9, ayah: 93 },
  { hizb: 22, surahNumber: 10, ayah: 26 },
  { hizb: 23, surahNumber: 11, ayah: 6 },
  { hizb: 24, surahNumber: 11, ayah: 84 },
  { hizb: 25, surahNumber: 12, ayah: 53 },
  { hizb: 26, surahNumber: 13, ayah: 19 },
  { hizb: 27, surahNumber: 15, ayah: 1 },
  { hizb: 28, surahNumber: 16, ayah: 51 },
  { hizb: 29, surahNumber: 17, ayah: 1 },
  { hizb: 30, surahNumber: 17, ayah: 99 },
  { hizb: 31, surahNumber: 18, ayah: 75 },
  { hizb: 32, surahNumber: 20, ayah: 1 },
  { hizb: 33, surahNumber: 21, ayah: 1 },
  { hizb: 34, surahNumber: 22, ayah: 1 },
  { hizb: 35, surahNumber: 23, ayah: 1 },
  { hizb: 36, surahNumber: 24, ayah: 21 },
  { hizb: 37, surahNumber: 25, ayah: 21 },
  { hizb: 38, surahNumber: 26, ayah: 111 },
  { hizb: 39, surahNumber: 27, ayah: 59 },
  { hizb: 40, surahNumber: 28, ayah: 51 },
  { hizb: 41, surahNumber: 29, ayah: 46 },
  { hizb: 42, surahNumber: 31, ayah: 22 },
  { hizb: 43, surahNumber: 33, ayah: 35 },
  { hizb: 44, surahNumber: 34, ayah: 24 },
  { hizb: 45, surahNumber: 36, ayah: 28 },
  { hizb: 46, surahNumber: 37, ayah: 149 },
  { hizb: 47, surahNumber: 39, ayah: 32 },
  { hizb: 48, surahNumber: 40, ayah: 41 },
  { hizb: 49, surahNumber: 41, ayah: 47 },
  { hizb: 50, surahNumber: 43, ayah: 24 },
  { hizb: 51, surahNumber: 46, ayah: 1 },
  { hizb: 52, surahNumber: 48, ayah: 18 },
  { hizb: 53, surahNumber: 51, ayah: 31 },
  { hizb: 54, surahNumber: 55, ayah: 1 },
  { hizb: 55, surahNumber: 58, ayah: 1 },
  { hizb: 56, surahNumber: 62, ayah: 1 },
  { hizb: 57, surahNumber: 67, ayah: 1 },
  { hizb: 58, surahNumber: 72, ayah: 1 },
  { hizb: 59, surahNumber: 78, ayah: 1 },
  { hizb: 60, surahNumber: 87, ayah: 1 },
];
