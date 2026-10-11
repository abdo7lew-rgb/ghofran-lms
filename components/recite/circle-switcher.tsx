"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CircleSwitcher({
  circles,
  circleId,
  date,
}: {
  circles: { id: number; name: string }[];
  circleId: number;
  date: string;
}) {
  const router = useRouter();
  if (circles.length < 2) return null;
  return (
    <Select value={String(circleId)} onValueChange={(v) => router.push(`/recite?circle=${v}&date=${date}`)}>
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {circles.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
