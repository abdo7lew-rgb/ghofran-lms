import { cache, type ReactNode } from "react";
import type { Metadata } from "next";
import { BookOpen, CalendarCheck, GraduationCap, Percent, User, Users } from "lucide-react";
import {
  listReportTargets,
  getStudentReport,
  getCircleReport,
  getTeacherReport,
} from "@/lib/actions/reports";
import { MEMORIZATION_GRADE_MAX, formatMonth, gradeVerdict } from "@/lib/labels";
import { StudentPrintSheet } from "@/components/reports/student-print-sheet";
import { ReportFilters } from "@/components/reports/report-filters";
import { PrintableReport } from "@/components/reports/printable-report";
import { GradeRing, gradeTone } from "@/components/reports/grade-ring";
import { StudentDays } from "@/components/reports/student-days";
import { CircleStudentsTable } from "@/components/reports/circle-students-table";
import { cn } from "@/lib/utils";

type SearchParams = { type?: string; targetId?: string; from?: string; to?: string; month?: string };

type Period = { from?: string; to?: string; month?: string; monthly: boolean; label: string; query: string };

// الافتراضي تقرير شهري للشهر الحالي؛ الفترة المخصصة (from/to) تُعرض بدون درجة الحفظ
function resolvePeriod(params: SearchParams, currentMonth: string): Period {
  const isCustom = !params.month && (params.from || params.to);
  if (!isCustom) {
    const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth;
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return {
      from: `${month}-01`,
      to: `${month}-${String(lastDay).padStart(2, "0")}`,
      month,
      monthly: true,
      label: `تقرير شهر ${formatMonth(month)}`,
      query: `month=${month}`,
    };
  }
  const sp = new URLSearchParams();
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  return {
    from: params.from,
    to: params.to,
    monthly: false,
    label: `الفترة من ${params.from || "البداية"} إلى ${params.to || "اليوم"}`,
    query: sp.toString(),
  };
}

// نفس الطلب يُستدعى من generateMetadata ومن الصفحة؛ cache يمنع تكرار الاستعلام
const loadStudentReport = cache(getStudentReport);

// عنوان الصفحة يصبح اسم ملف الـ PDF الافتراضي عند "حفظ كـ PDF"
export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const params = await searchParams;
  if (params.type && params.type !== "student") return { title: "التقارير" };
  if (!params.targetId) return { title: "التقارير" };
  const period = resolvePeriod(params, new Date().toISOString().slice(0, 7));
  const report = await loadStudentReport(Number(params.targetId), period.from, period.to, period.monthly);
  if (!report) return { title: "التقارير" };
  return {
    title: {
      absolute: period.month
        ? `تقرير ${report.student.fullName} - ${formatMonth(period.month)}`
        : `تقرير ${report.student.fullName}`,
    },
  };
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const type = params.type === "circle" || params.type === "teacher" ? params.type : "student";
  const targetId = params.targetId ? Number(params.targetId) : undefined;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const period = resolvePeriod(params, currentMonth);

  const targets = await listReportTargets();

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print">
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-sm text-muted-foreground">
          تابع حفظ الطلبة وحضورهم شهراً بشهر — درجة الحفظ الشهرية من {MEMORIZATION_GRADE_MAX}
        </p>
      </div>

      <ReportFilters
        type={type}
        targetId={params.targetId}
        month={period.month}
        from={params.from}
        to={params.to}
        currentMonth={currentMonth}
        students={targets.students.map((s) => ({ id: s.id, name: s.fullName, circleName: s.circleName }))}
        circles={targets.circles.map((c) => ({ id: c.id, name: c.name }))}
        teachers={targets.teachers}
      />

      {!targetId && <EmptyState type={type} />}
      {targetId && type === "student" && <StudentReportView studentId={targetId} period={period} />}
      {targetId && type === "circle" && <CircleReportView circleId={targetId} period={period} />}
      {targetId && type === "teacher" && <TeacherReportView teacherId={targetId} period={period} />}
    </div>
  );
}

function EmptyState({ type }: { type: string }) {
  const Icon = type === "circle" ? Users : type === "teacher" ? GraduationCap : User;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      <p className="font-medium">
        اختر {type === "circle" ? "حلقة" : type === "teacher" ? "مدرساً" : "طالباً"} لعرض التقرير
      </p>
      <p className="text-sm text-muted-foreground">يتحدّث التقرير مباشرة عند تغيير الاختيار أو الشهر</p>
    </div>
  );
}

async function StudentReportView({ studentId, period }: { studentId: number; period: Period }) {
  const report = await loadStudentReport(studentId, period.from, period.to, period.monthly);
  if (!report) return null;

  const presentDays = report.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const grade = report.memorizationGrade;

  return (
    <>
      <StudentPrintSheet
        studentName={report.student.fullName}
        circleName={report.circleName}
        teacherNames={report.teacherNames}
        periodLabel={period.label}
        grade={grade}
        attendanceRate={report.attendanceRate}
        attendance={report.attendance}
        days={report.days}
      />
      <div className="print:hidden">
        <PrintableReport
          title={report.student.fullName}
          subtitle={`الحلقة: ${report.circleName}`}
          periodLabel={period.label}
          icon={<User className="size-6" />}
        >
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            {grade && (
              <div className="flex items-center gap-5 rounded-xl border p-5">
                <GradeRing score={grade.score} />
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">درجة الحفظ الشهرية</p>
                  <p className={cn("text-lg font-bold", gradeTone(grade.score))}>{gradeVerdict(grade.score)}</p>
                  <p className="text-sm text-muted-foreground">
                    حافظ في {grade.memorizedDays} يوم من {MEMORIZATION_GRADE_MAX}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard
                icon={<Percent className="size-5" />}
                label="نسبة الحضور"
                value={report.attendanceRate !== null ? `${report.attendanceRate}%` : "—"}
                progress={report.attendanceRate}
              />
              <StatCard icon={<CalendarCheck className="size-5" />} label="أيام الحضور" value={presentDays} />
              <StatCard icon={<BookOpen className="size-5" />} label="جلسات مسجلة" value={report.memorization.length} />
            </div>
          </div>

          <StudentDays days={report.days} />
        </PrintableReport>
      </div>
    </>
  );
}

async function CircleReportView({ circleId, period }: { circleId: number; period: Period }) {
  const report = await getCircleReport(circleId, period.from, period.to, period.monthly);
  if (!report) return null;

  return (
    <PrintableReport
      title={report.circle.name}
      subtitle={`المدرس: ${report.teacherNames.length ? report.teacherNames.join("، ") : "غير مسند"}`}
      periodLabel={period.label}
      icon={<Users className="size-6" />}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={<Users className="size-5" />} label="عدد الطلبة" value={report.studentCount} />
        {period.monthly && (
          <StatCard
            icon={<BookOpen className="size-5" />}
            label={`متوسط درجة الحفظ (من ${MEMORIZATION_GRADE_MAX})`}
            value={report.averageMemorizationGrade ?? "—"}
            progress={
              report.averageMemorizationGrade === null
                ? null
                : (report.averageMemorizationGrade / MEMORIZATION_GRADE_MAX) * 100
            }
          />
        )}
        <StatCard
          icon={<Percent className="size-5" />}
          label="نسبة الحضور العامة"
          value={report.attendanceRate !== null ? `${report.attendanceRate}%` : "—"}
          progress={report.attendanceRate}
        />
      </div>

      <CircleStudentsTable
        showGrade={period.monthly}
        periodQuery={period.query}
        rows={report.perStudent.map((s) => ({
          studentId: s.studentId,
          fullName: s.fullName,
          grade: s.memorizationGrade?.score ?? null,
          attendanceRate: s.attendanceRate,
        }))}
      />
    </PrintableReport>
  );
}

async function TeacherReportView({ teacherId, period }: { teacherId: number; period: Period }) {
  const report = await getTeacherReport(teacherId, period.from, period.to, period.monthly);
  if (!report) return null;

  return (
    <PrintableReport
      title={report.teacher.name}
      subtitle={report.circles.length ? `الحلقات: ${report.circles.join("، ")}` : "لا توجد حلقة مسندة"}
      periodLabel={period.label}
      icon={<GraduationCap className="size-6" />}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={<Users className="size-5" />} label="عدد الطلبة" value={report.studentCount} />
        {period.monthly && (
          <StatCard
            icon={<BookOpen className="size-5" />}
            label={`متوسط درجة الحفظ (من ${MEMORIZATION_GRADE_MAX})`}
            value={report.averageMemorizationGrade ?? "—"}
            progress={
              report.averageMemorizationGrade === null
                ? null
                : (report.averageMemorizationGrade / MEMORIZATION_GRADE_MAX) * 100
            }
          />
        )}
        <StatCard
          icon={<Percent className="size-5" />}
          label="نسبة الحضور العامة"
          value={report.attendanceRate !== null ? `${report.attendanceRate}%` : "—"}
          progress={report.attendanceRate}
        />
      </div>
    </PrintableReport>
  );
}

function StatCard({
  icon,
  label,
  value,
  progress,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  progress?: number | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {progress !== undefined && progress !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
  );
}
