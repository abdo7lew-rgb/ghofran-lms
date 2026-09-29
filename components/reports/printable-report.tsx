import type { ReactNode } from "react";
import { PrintButton } from "@/components/reports/print-button";

export function PrintableReport({
  title,
  subtitle,
  periodLabel,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  periodLabel: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm print:border-0 print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-5 print:bg-none print:p-0 print:pb-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm print:hidden">
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">مسجد الغفران — منظومة حلقات تحفيظ القرآن الكريم</p>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {subtitle} · {periodLabel}
            </p>
          </div>
        </div>
        <PrintButton />
      </div>
      <div className="flex flex-col gap-6 p-5 print:p-0 print:pt-4">{children}</div>
    </div>
  );
}
