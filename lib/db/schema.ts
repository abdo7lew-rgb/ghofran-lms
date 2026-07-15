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
  teacherId: integer("teacher_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

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

export const memorizationSessions = sqliteTable("memorization_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  sessionType: text("session_type", { enum: ["NEW", "REVIEW"] }).notNull(),
  surahNumber: integer("surah_number").notNull(),
  fromAyah: integer("from_ayah").notNull(),
  toAyah: integer("to_ayah").notNull(),
  rating: text("rating", {
    enum: ["EXCELLENT", "VERY_GOOD", "GOOD", "ACCEPTABLE", "WEAK"],
  }).notNull(),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});
