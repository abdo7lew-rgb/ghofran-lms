import { listTeachersWithStats } from "@/lib/actions/teachers";
import { TeacherDialog } from "@/components/teachers/teacher-dialog";
import { TeacherRowActions } from "@/components/teachers/teacher-row-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function TeachersPage() {
  const teachers = await listTeachersWithStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">المدرسون</h1>
          <p className="text-sm text-muted-foreground">إدارة حسابات المدرسين وحلقاتهم</p>
        </div>
        <TeacherDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المدرسين ({teachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد مدرسون بعد</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الحلقات</TableHead>
                  <TableHead>عدد الطلبة</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell dir="ltr" className="text-start text-muted-foreground">
                      {teacher.email}
                    </TableCell>
                    <TableCell>
                      {teacher.circles.length === 0 ? (
                        <span className="text-sm text-muted-foreground">لا توجد حلقة</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {teacher.circles.map((c) => (
                            <Badge key={c} variant="secondary">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{teacher.studentCount}</TableCell>
                    <TableCell>
                      <TeacherRowActions teacher={teacher} />
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
