import type { ReportDay, DayMemorizationStatus, MemorizationGrade } from "@/lib/actions/reports";
import {
  ATTENDANCE_STATUS_LABELS,
  DAY_MEMORIZATION_LABELS,
  MEMORIZATION_GRADE_MAX,
  SESSION_TYPE_LABELS,
  WEEKDAY_NAMES,
  gradeVerdict,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

const STATUS_PRINT: Record<DayMemorizationStatus, string> = {
  MEMORIZED: "bg-[#e3f4ea] text-[#1c7a45] border-[#9fd5b5]",
  NOT_MEMORIZED: "bg-[#fbe4e4] text-[#b42323] border-[#eeaaaa]",
  REVIEW: "bg-[#e1f0fb] text-[#1f6fa8] border-[#a5cdeb]",
  NOT_RECITED: "bg-[#fdf1d8] text-[#9a6200] border-[#ecd08f]",
};

const COLUMN_WEEKDAYS = [6, 0, 1, 2, 3];

function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function buildWeeks(days: ReportDay[]): (ReportDay | null)[][] {
  const weeks: (ReportDay | null)[][] = [];
  let week: (ReportDay | null)[] = [];
  for (const day of days) {
    const col = COLUMN_WEEKDAYS.indexOf(weekday(day.date));
    if (col === -1) continue;
    if (week.length > col) {
      weeks.push(week);
      week = [];
    }
    while (week.length < col) week.push(null);
    week.push(day);
  }
  if (week.length) weeks.push(week);
  return weeks.map((w) => [...w, ...Array<null>(COLUMN_WEEKDAYS.length - w.length).fill(null)]);
}

function encouragement(score: number) {
  const ratio = score / MEMORIZATION_GRADE_MAX;
  if (ratio >= 0.75) return "ما شاء الله، أداء ابنكم هذا الشهر مُشرِّف، ونسأل الله أن يثبّته ويزيده من فضله.";
  if (ratio >= 0.5) return "أداء ابنكم هذا الشهر طيب، ونطمح معكم إلى أن يكون أفضل في الشهر القادم بإذن الله.";
  return "نلاحظ أن ابنكم يحتاج هذا الشهر إلى مزيد من المتابعة، ونثق أنه بتعاونكم معنا قادر على التحسّن بإذن الله.";
}

/** نسخة الطباعة/PDF المرسلة لولي الأمر — لا تظهر على الشاشة */
export function StudentPrintSheet({
  studentName,
  circleName,
  teacherNames,
  periodLabel,
  grade,
  attendanceRate,
  attendance,
  days,
}: {
  studentName: string;
  circleName: string;
  teacherNames: string[];
  periodLabel: string;
  grade: MemorizationGrade | null;
  attendanceRate: number | null;
  attendance: { status: string }[];
  days: ReportDay[];
}) {
  const counted = days.filter((d) => d.memorizationStatus);
  const counts = { MEMORIZED: 0, NOT_MEMORIZED: 0, REVIEW: 0, NOT_RECITED: 0 } as Record<DayMemorizationStatus, number>;
  for (const d of counted) counts[d.memorizationStatus!]++;
  const present = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absent = attendance.filter((a) => a.status === "ABSENT").length;
  const excused = attendance.filter((a) => a.status === "EXCUSED").length;
  const issued = new Date().toISOString().slice(0, 10);

  return (
    <article className="hidden text-[12px] leading-relaxed text-[#1d2433] print:block">
      <header className="flex items-start justify-between border-b-2 border-[#0f6b4f] pb-3">
        <div>
          <p className="text-lg font-bold text-[#0f6b4f]">مسجد الغفران</p>
          <p className="text-[11px] text-[#5b6475]">حلقات تحفيظ القرآن الكريم</p>
          <p className="mt-0.5 text-[11px] italic text-[#5b6475]">«خيركم من تعلّم القرآن وعلّمه»</p>
        </div>
        <div className="text-end">
          <p className="text-lg font-bold">{grade ? "التقرير الشهري لولي الأمر" : "تقرير متابعة الطالب"}</p>
          <p className="text-[11px] text-[#5b6475]">{periodLabel}</p>
        </div>
      </header>

      <section className="mt-3 grid grid-cols-4 gap-2 rounded-md bg-[#f4f6f5] p-3">
        <Info label="اسم الطالب" value={studentName} strong />
        <Info label="الحلقة" value={circleName || "—"} />
        <Info label="المحفّظ" value={teacherNames.join("، ") || "—"} />
        <Info label="تاريخ الإصدار" value={issued} />
      </section>

      <section className="mt-3 flex gap-3">
        {grade && (
          <div className="flex w-44 shrink-0 flex-col items-center justify-center rounded-md border-2 border-[#0f6b4f] p-3 text-center">
            <p className="text-[11px] text-[#5b6475]">درجة الحفظ الشهرية</p>
            <p className="text-3xl font-bold text-[#0f6b4f]">
              {grade.score}
              <span className="text-base font-medium text-[#5b6475]"> / {MEMORIZATION_GRADE_MAX}</span>
            </p>
            <p className="font-semibold">{gradeVerdict(grade.score)}</p>
          </div>
        )}
        <div className="grid flex-1 grid-cols-4 gap-2">
          <Box label="نسبة الحضور" value={attendanceRate !== null ? `${attendanceRate}%` : "—"} />
          <Box label="أيام الحضور" value={present} />
          <Box label="أيام الغياب" value={absent} />
          <Box label="غياب بإذن" value={excused} />
          {(Object.keys(counts) as DayMemorizationStatus[]).map((s) => (
            <div key={s} className={cn("rounded-md border p-2 text-center", STATUS_PRINT[s])}>
              <p className="text-[11px]">{DAY_MEMORIZATION_LABELS[s]}</p>
              <p className="text-lg font-bold">{counts[s]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 break-inside-avoid">
        <h3 className="mb-1.5 font-bold">نظرة على الشهر</h3>
        <div className="grid grid-cols-5 gap-1">
          {COLUMN_WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10px] font-semibold text-[#5b6475]">
              {WEEKDAY_NAMES[w]}
              {w === 6 && <span className="font-normal"> (مراجعة)</span>}
            </div>
          ))}
          {buildWeeks(days)
            .flat()
            .map((day, i) =>
              day ? (
                <div
                  key={day.date}
                  className={cn(
                    "flex h-10 flex-col items-center justify-center rounded border",
                    day.memorizationStatus ? STATUS_PRINT[day.memorizationStatus] : "border-dashed border-[#d5d9e0] text-[#9aa1ad]"
                  )}
                >
                  <span className="font-bold leading-none">{Number(day.date.slice(8))}</span>
                  <span className="text-[9px] leading-tight">
                    {day.memorizationStatus ? DAY_MEMORIZATION_LABELS[day.memorizationStatus] : ""}
                  </span>
                </div>
              ) : (
                <div key={`e${i}`} />
              )
            )}
        </div>
      </section>

      <section className="mt-4">
        <h3 className="mb-1.5 font-bold">السجل اليومي</h3>
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#0f6b4f] text-white">
              <th className="border border-[#0f6b4f] px-2 py-1 text-start font-semibold">التاريخ</th>
              <th className="border border-[#0f6b4f] px-2 py-1 text-start font-semibold">اليوم</th>
              <th className="border border-[#0f6b4f] px-2 py-1 text-start font-semibold">الحضور</th>
              <th className="border border-[#0f6b4f] px-2 py-1 text-start font-semibold">الحفظ</th>
              <th className="border border-[#0f6b4f] px-2 py-1 text-start font-semibold">ما سمّعه</th>
            </tr>
          </thead>
          <tbody>
            {counted.map((d, i) => (
              <tr key={d.date} className={cn("break-inside-avoid", i % 2 && "bg-[#f7f8f9]")}>
                <td className="border border-[#dde1e6] px-2 py-1 tabular-nums">{d.date}</td>
                <td className="border border-[#dde1e6] px-2 py-1">{WEEKDAY_NAMES[weekday(d.date)]}</td>
                <td className="border border-[#dde1e6] px-2 py-1">
                  {d.attendanceStatus ? ATTENDANCE_STATUS_LABELS[d.attendanceStatus] : "—"}
                </td>
                <td className="border border-[#dde1e6] px-2 py-1">
                  <span className={cn("rounded border px-1.5 py-px text-[10px] font-semibold", STATUS_PRINT[d.memorizationStatus!])}>
                    {DAY_MEMORIZATION_LABELS[d.memorizationStatus!]}
                  </span>
                </td>
                <td className="border border-[#dde1e6] px-2 py-1">
                  {d.memorization.length
                    ? d.memorization.map((m) => `${SESSION_TYPE_LABELS[m.sessionType]}: ${m.summary}`).join(" — ")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 break-inside-avoid">
        <div className="rounded-md border border-[#dde1e6] p-3">
          <h3 className="mb-1 font-bold">كيف تُحسب درجة الحفظ؟</h3>
          <ul className="list-disc space-y-0.5 ps-4 text-[11px]">
            <li>
              يحفظ الطالب حفظاً جديداً <b>أربعة أيام</b> في الأسبوع (الأحد إلى الأربعاء)، أي <b>{MEMORIZATION_GRADE_MAX} يوماً</b> في
              الشهر، وكل يوم يُقيَّم فيه «حافظ» يُحتسب له درجة.
            </li>
            <li>
              يوم <b>السبت مخصّص للمراجعة</b>، ولذلك لا يُحتسب ضمن درجة الحفظ.
            </li>
            <li>
              يوما <b>الخميس والجمعة عطلة</b> أسبوعية.
            </li>
            <li>«لم يسمع» يعني يوماً لم يُسجَّل فيه تسميع للطالب، بسبب الغياب أو غيره.</li>
          </ul>
        </div>

        <div className="rounded-md border border-[#0f6b4f]/40 bg-[#f1f8f5] p-3">
          <h3 className="mb-1 font-bold text-[#0f6b4f]">إلى ولي الأمر الكريم</h3>
          <p className="text-[11px]">
            السلام عليكم ورحمة الله وبركاته، نضع بين أيديكم هذا التقرير عن مسيرة ابنكم مع كتاب الله. وهو ليس حكماً عليه، وإنما
            محاولة صادقة منّا لمساعدته على الوصول إلى <b>أفضل نسخة من نفسه</b>؛ فإن كان أداؤه طيباً فهو يستحق منكم التشجيع والثناء،
            وإن كان يحتاج إلى مزيد من الجهد فمتابعتكم له في البيت وتعاونكم معنا خير عون له بإذن الله.
          </p>
          {grade && <p className="mt-1.5 text-[11px] font-semibold">{encouragement(grade.score)}</p>}
        </div>
      </section>

      <footer className="mt-6 flex items-end justify-between break-inside-avoid text-[11px]">
        <div className="w-48 text-center">
          <div className="mb-1 border-b border-dashed border-[#9aa1ad] pb-6" />
          توقيع المحفّظ
        </div>
        <p className="text-center text-[10px] text-[#9aa1ad]">
          نسأل الله أن يجعله من أهل القرآن الذين هم أهل الله وخاصّته
        </p>
        <div className="w-48 text-center">
          <div className="mb-1 border-b border-dashed border-[#9aa1ad] pb-6" />
          ختم إدارة الحلقات
        </div>
      </footer>
    </article>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-[#5b6475]">{label}</p>
      <p className={cn(strong ? "text-sm font-bold" : "font-semibold")}>{value}</p>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-[#dde1e6] p-2 text-center">
      <p className="text-[11px] text-[#5b6475]">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
