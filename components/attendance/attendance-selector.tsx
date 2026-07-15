"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CircleOption = { id: number; name: string };

export function AttendanceSelector({
  circles,
  circleId,
  date,
}: {
  circles: CircleOption[];
  circleId: number;
  date: string;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} method="get" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">الحلقة</label>
        <Select
          name="circleId"
          defaultValue={String(circleId)}
          onValueChange={() => formRef.current?.requestSubmit()}
        >
          <SelectTrigger className="w-48">
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
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="text-sm font-medium">
          التاريخ
        </label>
        <Input
          id="date"
          type="date"
          name="date"
          defaultValue={date}
          onChange={() => formRef.current?.requestSubmit()}
          className="w-44"
        />
      </div>
    </form>
  );
}
