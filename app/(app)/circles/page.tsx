import { listCirclesWithStats, listTeacherOptions } from "@/lib/actions/circles";
import { CircleDialog } from "@/components/circles/circle-dialog";
import { CircleRowActions } from "@/components/circles/circle-row-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function CirclesPage() {
  const [circles, teacherOptions] = await Promise.all([listCirclesWithStats(), listTeacherOptions()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">الحلقات</h1>
          <p className="text-sm text-muted-foreground">إدارة حلقات التحفيظ وإسناد المدرسين</p>
        </div>
        <CircleDialog teacherOptions={teacherOptions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الحلقات ({circles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {circles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد حلقات بعد</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الحلقة</TableHead>
                  <TableHead>المدرس المسؤول</TableHead>
                  <TableHead>عدد الطلبة</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {circles.map((circle) => (
                  <TableRow key={circle.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        {circle.name}
                        {circle.description && (
                          <span className="text-xs text-muted-foreground">{circle.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {circle.teacherName ?? <span className="text-muted-foreground">غير مسند</span>}
                    </TableCell>
                    <TableCell>{circle.studentCount}</TableCell>
                    <TableCell>
                      <CircleRowActions circle={circle} teacherOptions={teacherOptions} />
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
