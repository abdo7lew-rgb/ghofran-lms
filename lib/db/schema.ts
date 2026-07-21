import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["SUPER_ADMIN", "TEACHER"] }).notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const circles = sqliteTable("circles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// علاقة متعددة إلى متعددة: يمكن لأكثر من مدرس أن يشرف على نفس الحلقة، وللمدرس أن يشرف على أكثر من حلقة
export const circleTeachers = sqliteTable(
  "circle_teachers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    circleId: integer("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("circle_teachers_unique_idx").on(table.circleId, table.teacherId)]
);

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  age: integer("age"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  circleId: integer("circle_id")
    .notNull()
    .references(() => circles.id, { onDelete: "cascade" }),
  joinDate: text("join_date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const attendanceRecords = sqliteTable(
  "attendance_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    status: text("status", { enum: ["PRESENT", "ABSENT", "LATE", "EXCUSED"] }).notNull(),
    notes: text("notes"),
    recordedBy: integer("recorded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("attendance_student_date_idx").on(table.studentId, table.date)]
);

// جلسة واحدة (تسميع أو مراجعة) يمكن أن تحتوي على عدة مقاطع (session items)
export const memorizationSessions = sqliteTable("memorization_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  sessionType: text("session_type", { enum: ["NEW", "REVIEW"] }).notNull(),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// مقاطع الجلسة: كل مقطع يحتوي سورة + مطلع + نهاية + تقييم اختياري
export const memorizationSessionItems = sqliteTable("memorization_session_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => memorizationSessions.id, { onDelete: "cascade" }),
  surahNumber: integer("surah_number").notNull(),
  // مطلع المقطع: إما رقم آية (fromAyah) أو نص حر يصف المطلع (fromText) — أحدهما فقط، وكلاهما اختياري.
  fromAyah: integer("from_ayah"),
  fromText: text("from_text"),
  // إن كان المقطع يمتد عبر أكثر من سورة (شائع في المراجعة)، تحمل toSurahNumber رقم السورة الأخيرة
  // وتصير toAyah رقم الآية داخل تلك السورة. إن كانت null فالمقطع ضمن surahNumber نفسها كما كان سابقاً.
  toSurahNumber: integer("to_surah_number"),
  // نهاية التسميع اختيارية أيضاً (يمكن تسجيل الجلسة برأس الثمن/الآية فقط دون تحديد أين توقف الطالب).
  // حساب "آخر موضع/بداية التسميع القادم" يتعامل مع هذا: يستخدم fromAyah كبديل إن كانت toAyah فارغة.
  toAyah: integer("to_ayah"),
  rating: text("rating", {
    enum: ["EXCELLENT", "VERY_GOOD", "GOOD", "ACCEPTABLE", "WEAK"],
  }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});
