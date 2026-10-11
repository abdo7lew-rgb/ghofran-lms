import { listMyCircles } from "@/lib/actions/circles";
import { getReciteBoard } from "@/lib/actions/recite";
import { compareCircleNames } from "@/lib/labels";
import { isHoliday } from "@/lib/holidays";
import { DateNav } from "@/components/date-nav";
import { CircleSwitcher } from "@/components/recite/circle-switcher";
import { ReciteBoard } from "@/components/recite/recite-board";

export default async function RecitePage({
  searchParams,
}: {
  searchParams: Promise<{ circle?: string; date?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const requested = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const date = requested > today ? today : requested;

  const circles = (await listMyCircles()).sort((a, b) => compareCircleNames(a.name, b.name));
  if (circles.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">لا توجد حلقة مسندة إليك بعد. تواصل مع الشيخ المشرف.</p>;
  }
  const circle = circles.find((c) => String(c.id) === params.circle) ?? circles[0];
  const holiday = isHoliday(date);
  const rows = holiday ? [] : await getReciteBoard(circle.id, date);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">شاشة التسميع</h1>
        <p className="text-sm text-muted-foreground">سجّل كل طالب بضغطة: الحضور والتسميع معاً</p>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <DateNav date={date} today={today} keep={{ circle: String(circle.id) }} />
        <CircleSwitcher circles={circles.map((c) => ({ id: c.id, name: c.name }))} circleId={circle.id} date={date} />
      </div>
      {holiday ? (
        <p className="rounded-xl border py-10 text-center text-sm text-muted-foreground">
          هذا اليوم عطلة أسبوعية (الخميس/الجمعة) — لا يوجد تسميع
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border py-10 text-center text-sm text-muted-foreground">لا يوجد طلبة في هذه الحلقة</p>
      ) : (
        <ReciteBoard key={`${circle.id}-${date}`} rows={rows} date={date} circleName={circle.name} />
      )}
    </div>
  );
}
