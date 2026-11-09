import Link from "next/link";
import { listStudents, listCircleOptionsForStudentForm, listRemovedStudents } from "@/lib/actions/students";
import { requireSession } from "@/lib/auth/guards";
import { StudentDialog } from "@/components/students/student-dialog";
import { StudentRowActions } from "@/components/students/student-row-actions";
import { RestoreStudentDialog } from "@/components/students/restore-student-dialog";
import { ListFilters } from "@/components/list-filters";
import { matchesSearch } from "@/lib/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; circle?: string }>;
}) {
  const { q, circle } = await searchParams;
  const session = await requireSession();
  const isAdmin = session.user.role === "SUPER_ADMIN";
  const [allStudents, circleOptions, allRemoved] = await Promise.all([
    listStudents(),
    listCircleOptionsForStudentForm(),
    isAdmin ? listRemovedStudents() : Promise.resolve([]),
  ]);
  const removedStudents = allRemoved.filter(
    (s) => !q || matchesSearch(`${s.fullName} ${s.guardianName ?? ""} ${s.guardianPhone ?? ""}`, q)
  );
  const isFiltered = Boolean(q || circle);
  const students = allStudents.filter(
    (s) =>
      (!circle || String(s.circleId) === circle) &&
      (!q || matchesSearch(`${s.fullName} ${s.guardianName ?? ""} ${s.guardianPhone ?? ""}`, q))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">الطلبة</h1>
          <p className="text-sm text-muted-foreground">إدارة بيانات الطلبة</p>
        </div>
        {circleOptions.length > 0 && <StudentDialog circleOptions={circleOptions} />}
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle>
            قائمة الطلبة ({isFiltered ? `${students.length} من ${allStudents.length}` : allStudents.length})
          </CardTitle>
          {allStudents.length > 0 && (
            <ListFilters
              circles={circleOptions}
              query={q}
              circleId={circle}
              placeholder="ابحث بالاسم أو اسم ولي الأمر أو رقمه..."
            />
          )}
        </CardHeader>
        <CardContent>
          {circleOptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد حلقة مسندة إليك بعد. تواصل مع الشيخ المشرف.
            </p>
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isFiltered ? "لا يوجد طالب يطابق البحث" : "لا يوجد طلبة بعد"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>العمر</TableHead>
                  <TableHead>الحلقة</TableHead>
                  <TableHead>ولي الأمر</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <Link href={`/students/${student.id}`} className="hover:underline">
                        {student.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{student.age ?? "—"}</TableCell>
                    <TableCell>{student.circleName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{student.guardianName || "—"}</span>
                        {student.guardianPhone && (
                          <span dir="ltr" className="text-muted-foreground">
                            {student.guardianPhone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{student.joinDate}</TableCell>
                    <TableCell>
                      <StudentRowActions student={student} circleOptions={circleOptions} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {removedStudents.length > 0 && !circle && (
        <Card>
          <CardHeader>
            <CardTitle>طلبة بدون حلقة ({removedStudents.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              طلبة أُلغوا من حلقاتهم. بياناتهم وسجلاتهم محفوظة، ولا يدخلون في إحصائيات الحلقات.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>آخر حلقة</TableHead>
                  <TableHead>ولي الأمر</TableHead>
                  <TableHead>تاريخ الإلغاء</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {removedStudents.map((student) => (
                  <TableRow key={student.id} className="text-muted-foreground">
                    <TableCell className="font-medium text-foreground">
                      <Link href={`/students/${student.id}`} className="hover:underline">
                        {student.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{student.lastCircleName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{student.guardianName || "—"}</span>
                        {student.guardianPhone && <span dir="ltr">{student.guardianPhone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{student.leftAt}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <RestoreStudentDialog
                          studentId={student.id}
                          studentName={student.fullName}
                          lastCircleId={student.circleId}
                          circleOptions={circleOptions}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
