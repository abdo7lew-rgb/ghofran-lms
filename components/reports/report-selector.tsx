"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: number; name: string };

export function ReportSelector({
  students,
  circles,
  teachers,
  defaults,
}: {
  students: Option[];
  circles: Option[];
  teachers: Option[];
  defaults: { type: string; targetId?: string; from?: string; to?: string };
}) {
  const [type, setType] = React.useState(defaults.type);
  const options = type === "student" ? students : type === "circle" ? circles : teachers;

  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1.5">
        <Label>نوع التقرير</Label>
        <Select name="type" value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">تقرير طالب</SelectItem>
            <SelectItem value="circle">تقرير حلقة</SelectItem>
            {teachers.length > 0 && <SelectItem value="teacher">تقرير مدرس</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{type === "student" ? "الطالب" : type === "circle" ? "الحلقة" : "المدرس"}</Label>
        <Select name="targetId" defaultValue={defaults.targetId} key={type}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="اختر..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.id} value={String(o.id)}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="from">من تاريخ</Label>
        <Input id="from" type="date" name="from" defaultValue={defaults.from} className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="to">إلى تاريخ</Label>
        <Input id="to" type="date" name="to" defaultValue={defaults.to} className="w-40" />
      </div>

      <Button type="submit">عرض التقرير</Button>
    </form>
  );
}
