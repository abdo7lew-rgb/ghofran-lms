import type { ReactNode } from "react";
import { PrintButton } from "@/components/reports/print-button";

export function PrintableReport({
  title,
  subtitle,
  from,
  to,
  children,
}: {
  title: string;
  subtitle: string;
  from?: string;
  to?: string;
  children: ReactNode;
}) {
  const rangeText = from || to ? `الفترة: من ${from || "البداية"} إلى ${to || "اليوم"}` : "الفترة: كل الفترات";

  return (
    <div className="rounded-lg border bg-card p-6 print:border-0 print:p-0 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-sm text-muted-foreground">مسجد الغفران — منظومة حلقات تحفيظ القرآن الكريم</p>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <p className="text-xs text-muted-foreground">{rangeText}</p>
        </div>
        <PrintButton />
      </div>
      <div className="flex flex-col gap-4 pt-4">{children}</div>
    </div>
  );
}
