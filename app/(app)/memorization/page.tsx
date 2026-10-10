import Link from "next/link";
import { listRecentSessions } from "@/lib/actions/memorization";
import { listStudents } from "@/lib/actions/students";
import { listMyCircles } from "@/lib/actions/circles";
import { ListFilters } from "@/components/list-filters";
import { MemorizationDialog } from "@/components/memorization/memorization-dialog";
import { MemorizationRowActions } from "@/components/memorization/memorization-row-actions";
import { formatItemRangeCompact } from "@/lib/quran/surahs";
import { SESSION_TYPE_LABELS, RATING_LABELS, WEEKDAY_NAMES } from "@/lib/labels";
import { isHoliday } from "@/lib/holidays";
import { DateNav } from "@/components/date-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const RATING_STYLES: Record<string, string> = {
  MEMORIZED: "border-success/40 bg-success/10 text-success",
  NOT_MEMORIZED: "border-destructive/40 bg-destructive/10 text-destructive",
};

// نتيجة الجلسة: حافظ إن وُجد مقطع مقيّم "حافظ"، لم يحفظ إن قُيّم بغير ذلك، وإلا بدون تقييم
function sessionResult(items: { rating: string | null }[]) {
  if (items.some((i) => i.rating === "MEMORIZED")) return "MEMORIZED";
  if (items.some((i) => i.rating === "NOT_MEMORIZED")) return "NOT_MEMORIZED";
  return null;
}

export default async function MemorizationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; circle?: string; date?: string }>;
}) {
  const params = await searchParams;
  const { q, circle } = params;
  const today = new Date().toISOString().slice(0, 10);
  const requested = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const date = requested > today ? today : requested;
  const circleId = circle ? Number(circle) : undefined;
  const [sessions, students, circles] = await Promise.all([
    listRecentSessions(circleId, q, date),
    listStudents(),
    listMyCircles(),
  ]);
  const isFiltered = Boolean(q || circle);
  const dayLabel = date === today ? "اليوم" : `${WEEKDAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()]} ${date}`;

  const results = sessions.map((s) => sessionResult(s.items));
  const memorized = results.filter((r) => r === "MEMORIZED").length;
  const notMemorized = results.filter((r) => r === "NOT_MEMORIZED").length;
  const unrated = results.length - memorized - notMemorized;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">الحفظ والمراجعة</h1>
          <p className="text-sm text-muted-foreground">جلسات اليوم، ويمكنك الرجوع لأي يوم سابق</p>
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

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>
            جلسات {dayLabel} ({sessions.length})
          </CardTitle>
          {sessions.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm">
              <span className={cn("rounded-full border px-3 py-0.5 font-medium", RATING_STYLES.MEMORIZED)}>
                حافظ: {memorized}
              </span>
              <span className={cn("rounded-full border px-3 py-0.5 font-medium", RATING_STYLES.NOT_MEMORIZED)}>
                لم يحفظ: {notMemorized}
              </span>
              {unrated > 0 && (
                <span className="rounded-full border px-3 py-0.5 text-muted-foreground">بدون تقييم: {unrated}</span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد حلقة مسندة إليك بعد. تواصل مع الشيخ المشرف.
            </p>
          ) : sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isHoliday(date)
                ? "هذا اليوم عطلة أسبوعية (الخميس/الجمعة)"
                : isFiltered
                  ? "لا توجد جلسات تطابق البحث في هذا اليوم"
                  : "لا توجد جلسات مسجلة في هذا اليوم"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المقاطع</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2.5 shrink-0 rounded-full",
                            results[i] === "MEMORIZED"
                              ? "bg-success"
                              : results[i] === "NOT_MEMORIZED"
                                ? "bg-destructive"
                                : "bg-muted-foreground/30"
                          )}
                        />
                        <Link href={`/students/${s.studentId}`} className="hover:underline">
                          {s.studentName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.sessionType === "NEW" ? "default" : "secondary"}>
                        {SESSION_TYPE_LABELS[s.sessionType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {s.items.map((item) => (
                          <span key={item.id} className="leading-6">
                            {formatItemRangeCompact(item)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        {s.items.map((item) =>
                          item.rating ? (
                            <span
                              key={item.id}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5",
                                RATING_STYLES[item.rating]
                              )}
                            >
                              {RATING_LABELS[item.rating]}
                            </span>
                          ) : (
                            <span key={item.id} className="text-xs leading-6 text-muted-foreground">
                              بدون تقييم
                            </span>
                          )
                        )}
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
