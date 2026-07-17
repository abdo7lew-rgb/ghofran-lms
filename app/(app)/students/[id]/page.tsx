import { notFound } from "next/navigation";
import { getStudentProfile } from "@/lib/actions/students";
import { getStudentMemorizationHistory, getStudentLastPosition } from "@/lib/actions/memorization";
import { getStudentAttendanceHistory } from "@/lib/actions/attendance";
import { listCircleOptionsForStudentForm } from "@/lib/actions/students";
import { getSurahName, formatAyahRange, formatAyahRangeCompact } from "@/lib/quran/surahs";
import { SESSION_TYPE_LABELS, RATING_LABELS, ATTENDANCE_STATUS_LABELS } from "@/lib/labels";
import { StudentDialog } from "@/components/students/student-dialog";
import { MemorizationDialog } from "@/components/memorization/memorization-dialog";
import { MemorizationRowActions } from "@/components/memorization/memorization-row-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Pencil } from "lucide-react";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId)) notFound();

  const profile = await getStudentProfile(studentId);
  if (!profile) notFound();

  const [memorization, attendance, lastPosition, circleOptions] = await Promise.all([
    getStudentMemorizationHistory(studentId),
    getStudentAttendanceHistory(studentId),
    getStudentLastPosition(studentId),
    listCircleOptionsForStudentForm(),
  ]);

  const { student, circleName } = profile;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{student.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            الحلقة: {circleName} — الانضمام: {student.joinDate}
          </p>
        </div>
        <StudentDialog
          student={student}
          circleOptions={circleOptions}
          trigger={
            <button className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
              <Pencil className="size-4" />
              تعديل البيانات
            </button>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>العمر</CardDescription>
            <CardTitle className="text-lg">{student.age ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>ولي الأمر</CardDescription>
            <CardTitle className="text-lg">{student.guardianName || "—"}</CardTitle>
            {student.guardianPhone && (
              <p dir="ltr" className="text-end text-sm text-muted-foreground">
                {student.guardianPhone}
              </p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>ملاحظات</CardDescription>
            <p className="text-sm">{student.notes || "لا توجد ملاحظات"}</p>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="size-5" />
          </div>
          {lastPosition ? (
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">آخر موضع في الحفظ الجديد</p>
                <p className="font-medium">
                  {formatAyahRange(lastPosition.last.surahNumber, lastPosition.last.fromAyah, lastPosition.last.toAyah)}
                  {" "}
                  <span className="text-xs text-muted-foreground">({lastPosition.last.date})</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">بداية التسميع القادم</p>
                <p className="font-medium">
                  {getSurahName(lastPosition.next.surahNumber)}: الآية {lastPosition.next.ayah}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لم يبدأ الطالب بعد بتسجيل الحفظ الجديد</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="memorization">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="memorization">سجل الحفظ والمراجعة</TabsTrigger>
            <TabsTrigger value="attendance">سجل الحضور</TabsTrigger>
          </TabsList>
          <MemorizationDialog students={[{ id: student.id, fullName: student.fullName, circleName }]} defaultStudentId={student.id} />
        </div>

        <TabsContent value="memorization">
          <Card>
            <CardContent className="pt-6">
              {memorization.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">لا توجد جلسات مسجلة بعد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المقاطع</TableHead>
                      <TableHead>التقييم</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memorization.map((s) => (
                      <TableRow key={s.id}>
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
                        <TableCell className="text-muted-foreground">{s.notes || "—"}</TableCell>
                        <TableCell>
                          <MemorizationRowActions id={s.id} studentId={student.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardContent className="pt-6">
              {attendance.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">لا توجد سجلات حضور بعد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              a.status === "PRESENT"
                                ? "success"
                                : a.status === "ABSENT"
                                  ? "destructive"
                                  : a.status === "LATE"
                                    ? "warning"
                                    : "secondary"
                            }
                          >
                            {ATTENDANCE_STATUS_LABELS[a.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
