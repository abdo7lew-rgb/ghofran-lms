import Link from "next/link";
import { listStudents, listCircleOptionsForStudentForm } from "@/lib/actions/students";
import { StudentDialog } from "@/components/students/student-dialog";
import { StudentRowActions } from "@/components/students/student-row-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function StudentsPage() {
  const [students, circleOptions] = await Promise.all([listStudents(), listCircleOptionsForStudentForm()]);

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
        <CardHeader>
          <CardTitle>قائمة الطلبة ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {circleOptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد حلقة مسندة إليك بعد. تواصل مع الشيخ المشرف.
            </p>
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد طلبة بعد</p>
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
    </div>
  );
}
