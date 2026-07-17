import Link from "next/link";
import { listRecentSessions } from "@/lib/actions/memorization";
import { listStudents } from "@/lib/actions/students";
import { MemorizationDialog } from "@/components/memorization/memorization-dialog";
import { MemorizationRowActions } from "@/components/memorization/memorization-row-actions";
import { formatAyahRangeCompact } from "@/lib/quran/surahs";
import { SESSION_TYPE_LABELS, RATING_LABELS } from "@/lib/labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function MemorizationPage() {
  const [sessions, students] = await Promise.all([listRecentSessions(), listStudents()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">الحفظ والمراجعة</h1>
          <p className="text-sm text-muted-foreground">تسجيل ومتابعة جلسات الحفظ الجديد والمراجعة</p>
        </div>
        {students.length > 0 && <MemorizationDialog students={students} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>آخر الجلسات المسجلة</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد حلقة مسندة إليك بعد. تواصل مع الشيخ المشرف.
            </p>
          ) : sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد جلسات مسجلة بعد</p>
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
                          <span key={item.id}>
                            {formatAyahRangeCompact(item.surahNumber, item.fromAyah, item.toAyah)}
                          </span>
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
                      <MemorizationRowActions id={s.id} studentId={s.studentId} />
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
