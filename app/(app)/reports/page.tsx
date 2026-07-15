import {
  listReportTargets,
  getStudentReport,
  getCircleReport,
  getTeacherReport,
} from "@/lib/actions/reports";
import { ATTENDANCE_STATUS_LABELS, SESSION_TYPE_LABELS, RATING_LABELS } from "@/lib/labels";
import { ReportSelector } from "@/components/reports/report-selector";
import { PrintableReport } from "@/components/reports/printable-report";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SearchParams = { type?: string; targetId?: string; from?: string; to?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const type = params.type === "circle" || params.type === "teacher" ? params.type : "student";
  const targetId = params.targetId ? Number(params.targetId) : undefined;
  const { from, to } = params;

  const targets = await listReportTargets();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">التقارير</h1>
        <p className="text-sm text-muted-foreground">اختر نوع التقرير والفترة الزمنية، ثم اطبعه أو صدّره كملف PDF</p>
      </div>

      <ReportSelector
        students={targets.students.map((s) => ({ id: s.id, name: s.fullName }))}
        circles={targets.circles.map((c) => ({ id: c.id, name: c.name }))}
        teachers={targets.teachers}
        defaults={{ type, targetId: params.targetId, from, to }}
      />

      {targetId && type === "student" && <StudentReportView studentId={targetId} from={from} to={to} />}
      {targetId && type === "circle" && <CircleReportView circleId={targetId} from={from} to={to} />}
      {targetId && type === "teacher" && <TeacherReportView teacherId={targetId} from={from} to={to} />}
    </div>
  );
}

async function StudentReportView({ studentId, from, to }: { studentId: number; from?: string; to?: string }) {
  const report = await getStudentReport(studentId, from, to);
  if (!report) return null;

  return (
    <PrintableReport
      title={`تقرير الطالب: ${report.student.fullName}`}
      subtitle={`الحلقة: ${report.circleName}`}
      from={from}
      to={to}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="نسبة الحضور" value={report.attendanceRate !== null ? `${report.attendanceRate}%` : "—"} />
        <Stat label="عدد أيام الحضور المسجلة" value={report.attendance.length} />
        <Stat label="عدد جلسات الحفظ/المراجعة" value={report.memorization.length} />
      </div>

      <div>
        <h3 className="mb-2 font-medium">سجل الحفظ والمراجعة</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الموضع</TableHead>
              <TableHead>التقييم</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.memorization.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.date}</TableCell>
                <TableCell>{SESSION_TYPE_LABELS[m.sessionType]}</TableCell>
                <TableCell>{m.positionText}</TableCell>
                <TableCell>{RATING_LABELS[m.rating]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 font-medium">سجل الحضور</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.attendance.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.date}</TableCell>
                <TableCell>{ATTENDANCE_STATUS_LABELS[a.status]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PrintableReport>
  );
}

async function CircleReportView({ circleId, from, to }: { circleId: number; from?: string; to?: string }) {
  const report = await getCircleReport(circleId, from, to);
  if (!report) return null;

  return (
    <PrintableReport
      title={`تقرير الحلقة: ${report.circle.name}`}
      subtitle={`المدرس: ${report.teacherName ?? "غير مسند"}`}
      from={from}
      to={to}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="عدد الطلبة" value={report.studentCount} />
        <Stat label="نسبة الحضور العامة" value={report.attendanceRate !== null ? `${report.attendanceRate}%` : "—"} />
        <Stat label="جلسات الحفظ المسجلة" value={report.memorizationSessionsCount} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الطالب</TableHead>
            <TableHead>نسبة الحضور</TableHead>
            <TableHead>عدد جلسات الحفظ الجديد</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.perStudent.map((s) => (
            <TableRow key={s.studentId}>
              <TableCell>{s.fullName}</TableCell>
              <TableCell>{s.attendanceRate !== null ? `${s.attendanceRate}%` : "—"}</TableCell>
              <TableCell>{s.newSessionsCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PrintableReport>
  );
}

async function TeacherReportView({ teacherId, from, to }: { teacherId: number; from?: string; to?: string }) {
  const report = await getTeacherReport(teacherId, from, to);
  if (!report) return null;

  return (
    <PrintableReport
      title={`تقرير المدرس: ${report.teacher.name}`}
      subtitle={report.circles.length ? `الحلقات: ${report.circles.join("، ")}` : "لا توجد حلقة مسندة"}
      from={from}
      to={to}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="عدد الطلبة" value={report.studentCount} />
        <Stat label="نسبة الحضور العامة" value={report.attendanceRate !== null ? `${report.attendanceRate}%` : "—"} />
        <Stat label="جلسات الحفظ المسجلة" value={report.memorizationSessionsCount} />
      </div>
    </PrintableReport>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
