import { requireSession } from "@/lib/auth/guards";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, UserCog, CalendarCheck } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">
          مرحباً، {session.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {session.user.role === "SUPER_ADMIN" ? "نظرة عامة على جميع الحلقات" : "نظرة عامة على حلقتك"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {session.user.role === "SUPER_ADMIN" && (
          <StatCard title="عدد المدرسين" value={stats.teacherCount ?? 0} icon={UserCog} />
        )}
        <StatCard title="عدد الحلقات" value={stats.circleCount} icon={Users} />
        <StatCard title="عدد الطلبة" value={stats.studentCount} icon={GraduationCap} />
        <StatCard title="نسبة الحضور (٣٠ يوماً)" value={`${stats.attendanceRate}%`} icon={CalendarCheck} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقدم الحلقات</CardTitle>
          <CardDescription>عدد جلسات الحفظ الجديد المسجلة خلال آخر ٣٠ يوماً لكل حلقة</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.circleProgress.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد بيانات كافية بعد</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.circleProgress.map((c) => (
                <div key={c.circleId} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{c.circleName}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, c.sessionsCount * 5)}%` }}
                      />
                    </div>
                    <span className="w-10 text-end text-xs text-muted-foreground">{c.sessionsCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
