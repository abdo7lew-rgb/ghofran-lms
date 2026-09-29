import { MEMORIZATION_GRADE_MAX } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function gradeTone(score: number) {
  const ratio = score / MEMORIZATION_GRADE_MAX;
  return ratio >= 0.75 ? "text-success" : ratio >= 0.5 ? "text-warning" : "text-destructive";
}

export function GradeRing({ score, size = 132 }: { score: number; size?: number }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(score, MEMORIZATION_GRADE_MAX) / MEMORIZATION_GRADE_MAX);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-700", gradeTone(score))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">من {MEMORIZATION_GRADE_MAX}</span>
      </div>
    </div>
  );
}
