import { listMyCircles } from "@/lib/actions/circles";
import { getAttendanceSheet } from "@/lib/actions/attendance";
import { AttendanceSelector } from "@/components/attendance/attendance-selector";
import { AttendanceForm } from "@/components/attendance/attendance-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ circleId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const circles = await listMyCircles();

  if (circles.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">الحضور والغياب</h1>
        <p className="text-sm text-muted-foreground">لا توجد حلقة مسندة إليك بعد. تواصل مع الشيخ المشرف.</p>
      </div>
    );
  }

  const circleId = params.circleId ? Number(params.circleId) : circles[0].id;
  const date = params.date || today();

  const sheet = await getAttendanceSheet(circleId, date);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">الحضور والغياب</h1>
        <p className="text-sm text-muted-foreground">تسجيل حضور طلبة الحلقة ليوم محدد</p>
      </div>

      <AttendanceSelector circles={circles} circleId={circleId} date={date} />

      <Card>
        <CardHeader>
          <CardTitle>
            {sheet.circleName} — {date}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sheet.students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد طلبة في هذه الحلقة بعد</p>
          ) : (
            <AttendanceForm circleId={circleId} date={date} students={sheet.students} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
