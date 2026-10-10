import Link from "next/link";
import { listRecentSessions } from "@/lib/actions/memorization";
import { listStudents } from "@/lib/actions/students";
import { listMyCircles } from "@/lib/actions/circles";
import { ListFilters } from "@/components/list-filters";
import { MemorizationDialog } from "@/components/memorization/memorization-dialog";
import { MemorizationRowActions } from "@/components/memorization/memorization-row-actions";
import { formatItemRangeCompact } from "@/lib/quran/surahs";
import { SESSION_TYPE_LABELS, RATING_LABELS, WEEKDAY_NAMES } from "@/lib/labels";
import { getDailySummary } from "@/lib/actions/reports";
import { isHoliday } from "@/lib/holidays";
import { DateNav } from "@/components/date-nav";
import { DailySummary } from "@/components/memorization/daily-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function MemorizationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; circle?: string; date?: string }>;
}) {
  const params = await searchParams;
  const { q, circle } = params;
  const today = new Date().toISOString().slice(0, 10);
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const circleId = circle ? Number(circle) : undefined;
  const holiday = isHoliday(date);
  const [sessions, students, circles, summary] = await Promise.all([
    listRecentSessions(circleId, q, date),
    listStudents(),
    listMyCircles(),
    holiday ? Promise.resolve([]) : getDailySummary(date, circleId, q),
  ]);
  const isFiltered = Boolean(q || circle);
  const dayLabel = `${WEEKDAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()]} ${date}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">الحفظ والمراجعة</h1>
          <p className="text-sm text-muted-foreground">تسجيل ومتابعة جلسات الحفظ الجديد والمراجعة يوماً بيوم</p>
        </div>
        {students.length > 0 && <MemorizationDialog students={students} defaultDate={date} />}
      </div>

      {students.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <DateNav date={date} today={today} keep={{ q, circle }} />
          <ListFilters
            circles={circles.map((c) => ({ id: c.id, name: c.name }))}
            query={q}
            circleId={circle}
            keep={{ date: params.date }}
          />
        </div>
      )}

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المحصلة اليومية — {dayLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            {holiday ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                هذا اليوم عطلة أسبوعية (الخميس/الجمعة) — لا يوجد تسميع
              </p>
            ) : (
              <DailySummary rows={summary} date={date} showCircle={!circle && circles.length > 1} />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>جلسات اليوم ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد حلقة مسندة إليك بعد. تواصل مع الشيخ المشرف.
            </p>
          ) : sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isFiltered ? "لا توجد جلسات تطابق البحث في هذا اليوم" : "لا توجد جلسات مسجلة في هذا اليوم"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المقاطع</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/students/${s.studentId}`} className="hover:underline">
                        {s.studentName}
                      </Link>
                    </TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>
                      <Badge variant={s.sessionType === "NEW" ? "default" : "secondary"}>
                        {SESSION_TYPE_LABELS[s.sessionType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {s.items.map((item) => (
                          <span key={item.id}>{formatItemRangeCompact(item)}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {s.items.map((item) => (
                          <span key={item.id}>{item.rating ? RATING_LABELS[item.rating] : "—"}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <MemorizationRowActions
                        session={s}
                        studentId={s.studentId}
                        student={{ id: s.studentId, fullName: s.studentName, circleName: "" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
