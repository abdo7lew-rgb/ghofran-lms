import { isNull } from "drizzle-orm";
import { students } from "@/lib/db/schema";

/** الطالب النشط = غير ملغى من الحلقة (left_at فارغ). */
export const isActiveStudent = isNull(students.leftAt);
