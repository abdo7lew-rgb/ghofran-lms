import type { MemorizationGrade } from "@/lib/actions/reports";
import { MEMORIZATION_GRADE_MAX, gradeVerdict } from "@/lib/labels";

function encouragement(score: number) {
  const ratio = score / MEMORIZATION_GRADE_MAX;
  if (ratio >= 0.75) return "ما شاء الله، أداء ابنكم هذا الشهر مُشرِّف، ونسأل الله أن يثبّته ويزيده من فضله.";
  if (ratio >= 0.5) return "أداء ابنكم هذا الشهر طيب، ونطمح معكم إلى أن يكون أفضل في الشهر القادم بإذن الله.";
  return "نلاحظ أن ابنكم يحتاج هذا الشهر إلى مزيد من المتابعة، ونثق أنه بتعاونكم معنا قادر على التحسّن بإذن الله.";
}

/** نسخة الطباعة/PDF المرسلة لولي الأمر — صفحة واحدة مختصرة وواضحة. لا تظهر على الشاشة. */
export function StudentPrintSheet({
  studentName,
  circleName,
  teacherNames,
  periodLabel,
  grade,
  attendance,
  lastPosition,
}: {
  studentName: string;
  circleName: string;
  teacherNames: string[];
  periodLabel: string;
  grade: MemorizationGrade | null;
  attendance: { status: string }[];
  /** آخر ما وصل إليه الطالب في الحفظ الجديد خلال الفترة */
  lastPosition: string | null;
}) {
  const present = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absent = attendance.filter((a) => a.status === "ABSENT").length;
  const excused = attendance.filter((a) => a.status === "EXCUSED").length;

  return (
    <article className="hidden text-[14px] leading-relaxed text-[#1d2433] print:block">
      <header className="flex items-center justify-between border-b-2 border-[#0f6b4f] pb-3">
        <div>
          <p className="text-xl font-bold text-[#0f6b4f]">مسجد الغفران</p>
          <p className="text-[12px] text-[#5b6475]">حلقات تحفيظ القرآن الكريم</p>
        </div>
        <div className="text-end">
          <p className="text-xl font-bold">تقرير الطالب لولي الأمر</p>
          <p className="text-[12px] text-[#5b6475]">{periodLabel}</p>
        </div>
      </header>

      <section className="mt-5 rounded-lg bg-[#f4f6f5] px-4 py-3">
        <p className="text-[18px] font-bold">{studentName}</p>
        <p className="text-[13px] text-[#5b6475]">
          الحلقة: {circleName || "—"}
          {teacherNames.length > 0 && <> — المحفّظ: {teacherNames.join("، ")}</>}
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-lg border-2 border-[#0f6b4f] p-4 text-center">
          <p className="text-[13px] text-[#5b6475]">الحفظ</p>
          {grade ? (
            <>
              <p className="text-4xl font-bold text-[#0f6b4f]">
                {grade.score}
                <span className="text-lg font-medium text-[#5b6475]"> / {MEMORIZATION_GRADE_MAX}</span>
              </p>
              <p className="text-[16px] font-bold">{gradeVerdict(grade.score)}</p>
              <p className="mt-1 text-[11px] text-[#5b6475]">
                حفظ في {grade.memorizedDays} يوم من أصل {MEMORIZATION_GRADE_MAX} يوم حفظ في الشهر
              </p>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-[#5b6475]">الدرجة تظهر في التقرير الشهري</p>
          )}
        </div>

        <div className="rounded-lg border-2 border-[#dde1e6] p-4 text-center">
          <p className="text-[13px] text-[#5b6475]">الحضور</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Count label="حضر" value={present} className="text-[#1c7a45]" />
            <Count label="غاب" value={absent} className="text-[#b42323]" />
            <Count label="بعذر" value={excused} className="text-[#5b6475]" />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-[#dde1e6] px-4 py-3">
        <span className="text-[13px] text-[#5b6475]">وصل في الحفظ إلى: </span>
        <span className="font-bold">{lastPosition ?? "لم يُسجَّل حفظ جديد في هذه الفترة"}</span>
      </section>

      <section className="mt-5 rounded-lg border border-[#0f6b4f]/40 bg-[#f1f8f5] p-4">
        <h3 className="mb-1 font-bold text-[#0f6b4f]">إلى ولي الأمر الكريم</h3>
        <p className="text-[13px]">
          السلام عليكم ورحمة الله وبركاته، نضع بين أيديكم هذا التقرير عن مسيرة ابنكم مع كتاب الله. وهو ليس حكماً عليه، وإنما
          محاولة صادقة منّا لمساعدته على الوصول إلى <b>أفضل نسخة من نفسه</b>؛ فإن كان أداؤه طيباً فهو يستحق منكم التشجيع والثناء،
          وإن كان يحتاج إلى مزيد من الجهد فمتابعتكم له في البيت وتعاونكم معنا خير عون له بإذن الله.
        </p>
        {grade && <p className="mt-2 text-[13px] font-semibold">{encouragement(grade.score)}</p>}
      </section>

      <footer className="mt-8 flex items-end justify-between text-[12px]">
        <div className="w-44 text-center">
          <div className="mb-1 border-b border-dashed border-[#9aa1ad] pb-6" />
          توقيع المحفّظ
        </div>
        <div className="w-44 text-center">
          <div className="mb-1 border-b border-dashed border-[#9aa1ad] pb-6" />
          ختم إدارة الحلقات
        </div>
      </footer>
    </article>
  );
}

function Count({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <p className={`text-3xl font-bold ${className ?? ""}`}>{value}</p>
      <p className="text-[12px] text-[#5b6475]">{label}</p>
    </div>
  );
}
