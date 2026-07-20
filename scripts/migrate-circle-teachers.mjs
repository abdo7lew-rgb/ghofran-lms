// يطبّق الانتقال من علاقة "مدرس واحد لكل حلقة" (عمود circles.teacher_id) إلى علاقة متعددة
// إلى متعددة عبر جدول circle_teachers، مع نقل البيانات الحالية بأمان قبل حذف العمود القديم.
// آمن للتكرار (يتحقق من الحالة قبل كل خطوة). بدون بيانات TURSO_* في .env: يطبّق على dev.db المحلي.
//
// درسان مهمّان تعلّمناهما بالطريقة الصعبة (حادثة فقدان بيانات حقيقية على قاعدة الإنتاج، تم استرجاعها
// لاحقاً عبر Turso point-in-time recovery) بخصوص إعادة إنشاء جدول تشير إليه جداول أخرى عبر foreign key:
//
// 1) "ALTER TABLE X RENAME TO Y" يعيد كتابة قيود foreign key في كل الجداول الأخرى التي تشير إلى X
//    تلقائياً لتشير إلى "Y" (تم التحقق تجريبياً أن PRAGMA foreign_keys=OFF و legacy_alter_table=ON لا
//    يمنعان هذا في هذا الإصدار). الحل: لا نعيد تسمية الجدول الأصلي أبداً. بدلاً من ذلك: نُنشئ الجدول
//    الجديد تحت اسم مؤقت (x_new)، ننسخ البيانات إليه، نحذف الجدول الأصلي (DROP وليس RENAME)، ثم نُعيد
//    تسمية x_new إلى الاسم النهائي x. بما أنه لا يوجد أي جدول يشير إلى "x_new" فلا ينكسر شيء.
//
// 2) الأخطر: "DROP TABLE X" نفسه، إن كانت جداول أخرى تشير إلى X بقيد "ON DELETE CASCADE" و
//    PRAGMA foreign_keys مفعّلة (وهي مفعّلة افتراضياً على Turso/libSQL في الإنتاج)، فإن الحذف يُطلق
//    سلسلة حذف تلقائي (cascade) تمسح كل الصفوف في الجداول المرتبطة! هذا ما حدث فعلياً: حذف جدول
//    circles مسح كل الطلاب وسجلات الحضور والحفظ. الحل: نُعطّل PRAGMA foreign_keys مؤقتاً حول أي
//    DROP TABLE لجدول قد تشير إليه جداول أخرى، ثم نُعيد تفعيلها فوراً بعد إعادة التسمية.
//
// وكحماية إضافية أخيرة: نلتقط عدد صفوف كل جدول قبل أي تعديل، ونتحقق في النهاية أن لا جدول فقد أي صف
// (باستثناء الزيادة الطبيعية في circle_teachers) — إن حدث نقص غير متوقع نوقف السكربت فوراً بخطأ صريح
// بدل أن نكمل بصمت كما حدث سابقاً.
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("متصل بـ:", url);
const client = createClient(authToken ? { url, authToken } : { url });

async function tableExists(name) {
  const r = await client.execute({
    sql: "select name from sqlite_master where type='table' and name=?",
    args: [name],
  });
  return r.rows.length > 0;
}

async function fkTargetOk(table, fromColumn, expectedTable) {
  const fks = await client.execute(`pragma foreign_key_list(${table})`);
  const fk = fks.rows.find((r) => r.from === fromColumn);
  return { ok: Boolean(fk && fk.table === expectedTable), actual: fk?.table };
}

// ينفّذ دالة أثناء تعطيل فرض foreign key مؤقتاً (لمنع cascade عند DROP TABLE)، ويعيد تفعيلها دائماً
// حتى لو فشلت الدالة، حتى لا نترك الاتصال بحالة foreign_keys=OFF بالخطأ.
async function withForeignKeysOff(fn) {
  await client.execute("PRAGMA foreign_keys = OFF");
  try {
    await fn();
  } finally {
    await client.execute("PRAGMA foreign_keys = ON");
  }
}

async function allTableRowCounts() {
  const tables = await client.execute(
    "select name from sqlite_master where type='table' and name not like 'sqlite_%' and name != '__drizzle_migrations'"
  );
  const counts = {};
  for (const t of tables.rows) {
    const r = await client.execute(`select count(*) as c from "${t.name}"`);
    counts[t.name] = Number(r.rows[0].c);
  }
  return counts;
}

// إصلاح آمن لجدول "students" إن كان عمود circle_id يشير إلى جدول غير قائم (بقايا انكسار سابق)
async function repairStudentsIfNeeded() {
  const { ok, actual } = await fkTargetOk("students", "circle_id", "circles");
  console.log("   students.circle_id يشير إلى:", actual, "| سليم؟", ok);
  if (ok) return;
  console.log("   إصلاح جدول students بالنمط الآمن ...");
  await withForeignKeysOff(async () => {
    await client.execute(`CREATE TABLE students_new (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	full_name text NOT NULL,
	age integer,
	guardian_name text,
	guardian_phone text,
	circle_id integer NOT NULL,
	join_date text NOT NULL,
	notes text,
	created_at text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (circle_id) REFERENCES circles(id) ON UPDATE no action ON DELETE cascade
)`);
    await client.execute(
      "INSERT INTO students_new (id, full_name, age, guardian_name, guardian_phone, circle_id, join_date, notes, created_at) SELECT id, full_name, age, guardian_name, guardian_phone, circle_id, join_date, notes, created_at FROM students"
    );
    await client.execute("DROP TABLE students");
    await client.execute("ALTER TABLE students_new RENAME TO students");
  });
  console.log("   تم إصلاح students.");
}

// إصلاح آمن لجدول "attendance_records" إن كان عمود student_id يشير إلى جدول غير قائم
async function repairAttendanceRecordsIfNeeded() {
  const { ok, actual } = await fkTargetOk("attendance_records", "student_id", "students");
  console.log("   attendance_records.student_id يشير إلى:", actual, "| سليم؟", ok);
  if (ok) return;
  console.log("   إصلاح جدول attendance_records بالنمط الآمن ...");
  await withForeignKeysOff(async () => {
    await client.execute(`CREATE TABLE attendance_records_new (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	student_id integer NOT NULL,
	date text NOT NULL,
	status text NOT NULL,
	notes text,
	recorded_by integer,
	created_at text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (recorded_by) REFERENCES users(id) ON UPDATE no action ON DELETE set null
)`);
    await client.execute(
      "INSERT INTO attendance_records_new (id, student_id, date, status, notes, recorded_by, created_at) SELECT id, student_id, date, status, notes, recorded_by, created_at FROM attendance_records"
    );
    await client.execute("DROP TABLE attendance_records");
    await client.execute("ALTER TABLE attendance_records_new RENAME TO attendance_records");
    await client.execute("DROP INDEX IF EXISTS attendance_student_date_idx");
    await client.execute(
      "CREATE UNIQUE INDEX attendance_student_date_idx ON attendance_records (student_id, date)"
    );
  });
  console.log("   تم إصلاح attendance_records.");
}

// إصلاح آمن لجدول "memorization_sessions" إن كان عمود student_id يشير إلى جدول غير قائم
async function repairMemorizationSessionsIfNeeded() {
  const { ok, actual } = await fkTargetOk("memorization_sessions", "student_id", "students");
  console.log("   memorization_sessions.student_id يشير إلى:", actual, "| سليم؟", ok);
  if (ok) return;
  console.log("   إصلاح جدول memorization_sessions بالنمط الآمن ...");
  await withForeignKeysOff(async () => {
    await client.execute(`CREATE TABLE memorization_sessions_new (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	student_id integer NOT NULL,
	date text NOT NULL,
	session_type text NOT NULL,
	notes text,
	recorded_by integer,
	created_at text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (recorded_by) REFERENCES users(id) ON UPDATE no action ON DELETE set null
)`);
    await client.execute(
      "INSERT INTO memorization_sessions_new (id, student_id, date, session_type, notes, recorded_by, created_at) SELECT id, student_id, date, session_type, notes, recorded_by, created_at FROM memorization_sessions"
    );
    await client.execute("DROP TABLE memorization_sessions");
    await client.execute("ALTER TABLE memorization_sessions_new RENAME TO memorization_sessions");
  });
  console.log("   تم إصلاح memorization_sessions.");
}

// إصلاح آمن لجدول "memorization_session_items" إن كان عمود session_id يشير إلى جدول غير قائم
async function repairMemorizationSessionItemsIfNeeded() {
  const { ok, actual } = await fkTargetOk(
    "memorization_session_items",
    "session_id",
    "memorization_sessions"
  );
  console.log("   memorization_session_items.session_id يشير إلى:", actual, "| سليم؟", ok);
  if (ok) return;
  console.log("   إصلاح جدول memorization_session_items بالنمط الآمن ...");
  await withForeignKeysOff(async () => {
    await client.execute(`CREATE TABLE memorization_session_items_new (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	session_id integer NOT NULL,
	surah_number integer NOT NULL,
	from_ayah integer,
	from_text text,
	to_surah_number integer,
	to_ayah integer NOT NULL,
	rating text,
	sort_order integer DEFAULT 0 NOT NULL,
	created_at text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (session_id) REFERENCES memorization_sessions(id) ON UPDATE no action ON DELETE cascade
)`);
    await client.execute(
      "INSERT INTO memorization_session_items_new (id, session_id, surah_number, from_ayah, from_text, to_surah_number, to_ayah, rating, sort_order, created_at) SELECT id, session_id, surah_number, from_ayah, from_text, to_surah_number, to_ayah, rating, sort_order, created_at FROM memorization_session_items"
    );
    await client.execute("DROP TABLE memorization_session_items");
    await client.execute(
      "ALTER TABLE memorization_session_items_new RENAME TO memorization_session_items"
    );
  });
  console.log("   تم إصلاح memorization_session_items.");
}

async function repairCircleTeachersIfNeeded() {
  if (!(await tableExists("circle_teachers"))) return;
  const { ok, actual } = await fkTargetOk("circle_teachers", "circle_id", "circles");
  console.log("   circle_teachers.circle_id يشير إلى:", actual, "| سليم؟", ok);
  if (ok) return;
  console.log("   إصلاح جدول circle_teachers بالنمط الآمن ...");
  await withForeignKeysOff(async () => {
    await client.execute(`CREATE TABLE circle_teachers_new (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	circle_id integer NOT NULL,
	teacher_id integer NOT NULL,
	created_at text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (circle_id) REFERENCES circles(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (teacher_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
)`);
    await client.execute(
      "INSERT INTO circle_teachers_new (id, circle_id, teacher_id, created_at) SELECT id, circle_id, teacher_id, created_at FROM circle_teachers"
    );
    await client.execute("DROP TABLE circle_teachers");
    await client.execute("ALTER TABLE circle_teachers_new RENAME TO circle_teachers");
    await client.execute("DROP INDEX IF EXISTS circle_teachers_unique_idx");
    await client.execute(
      "CREATE UNIQUE INDEX circle_teachers_unique_idx ON circle_teachers (circle_id, teacher_id)"
    );
  });
  console.log("   تم إصلاح circle_teachers.");
}

const countsBefore = await allTableRowCounts();
console.log("عدد الصفوف قبل أي تعديل:", JSON.stringify(countsBefore));

const cols = await client.execute("pragma table_info(circles)");
const hasTeacherIdColumn = cols.rows.some((c) => c.name === "teacher_id");

const hasCircleTeachersTable = await tableExists("circle_teachers");

console.log("circles.teacher_id موجود حالياً؟", hasTeacherIdColumn);
console.log("جدول circle_teachers موجود حالياً؟", hasCircleTeachersTable);

if (!hasCircleTeachersTable) {
  console.log("\n1) إنشاء جدول circle_teachers ...");
  await client.execute(`CREATE TABLE circle_teachers (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	circle_id integer NOT NULL,
	teacher_id integer NOT NULL,
	created_at text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (circle_id) REFERENCES circles(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (teacher_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
)`);
  await client.execute(
    "CREATE UNIQUE INDEX circle_teachers_unique_idx ON circle_teachers (circle_id, teacher_id)"
  );
  console.log("   تم.");
} else {
  console.log("\n1) جدول circle_teachers موجود أصلاً، تخطّينا الإنشاء.");
}

if (hasTeacherIdColumn) {
  console.log("\n2) نقل بيانات الإسناد الحالية (circles.teacher_id -> circle_teachers) ...");
  const assigned = await client.execute(
    "select id as circle_id, teacher_id from circles where teacher_id is not null"
  );
  console.log(`   عدد الحلقات المُسندة حالياً: ${assigned.rows.length}`);
  for (const row of assigned.rows) {
    await client.execute({
      sql: "INSERT OR IGNORE INTO circle_teachers (circle_id, teacher_id) VALUES (?, ?)",
      args: [row.circle_id, row.teacher_id],
    });
  }
  console.log("   تم نقل البيانات.");

  console.log("\n3) إعادة إنشاء جدول circles بلا عمود teacher_id (بالنمط الآمن) ...");
  await withForeignKeysOff(async () => {
    await client.execute(`CREATE TABLE circles_new (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	name text NOT NULL,
	description text,
	created_at text DEFAULT (current_timestamp) NOT NULL
)`);
    await client.execute(
      "INSERT INTO circles_new (id, name, description, created_at) SELECT id, name, description, created_at FROM circles"
    );
    await client.execute("DROP TABLE circles");
    await client.execute("ALTER TABLE circles_new RENAME TO circles");
  });
  console.log("   تم.");
} else {
  console.log("\n2-3) عمود circles.teacher_id غير موجود أصلاً (تم الانتقال مسبقاً)، تخطّينا.");
}

console.log("\n4) التحقق من سلامة foreign key في circle_teachers ...");
await repairCircleTeachersIfNeeded();

console.log("\n5) التحقق من سلامة foreign key في students ...");
await repairStudentsIfNeeded();

console.log("\n6) التحقق من سلامة foreign key في attendance_records ...");
await repairAttendanceRecordsIfNeeded();

console.log("\n7) التحقق من سلامة foreign key في memorization_sessions ...");
await repairMemorizationSessionsIfNeeded();

console.log("\n8) التحقق من سلامة foreign key في memorization_session_items ...");
await repairMemorizationSessionItemsIfNeeded();

console.log("\n9) فحص شامل نهائي (PRAGMA foreign_key_check) ...");
const violations = await client.execute("PRAGMA foreign_key_check");
console.log("   عدد المخالفات:", violations.rows.length);
if (violations.rows.length > 0) {
  console.log("   تفاصيل:", JSON.stringify(violations.rows));
}

console.log("\n10) التحقق النهائي: هل فقد أي جدول أي صف؟ ...");
const countsAfter = await allTableRowCounts();
console.log("    عدد الصفوف بعد كل التعديلات:", JSON.stringify(countsAfter));
const lostRows = [];
for (const [table, before] of Object.entries(countsBefore)) {
  const after = countsAfter[table] ?? 0;
  if (after < before) {
    lostRows.push(`${table}: ${before} -> ${after}`);
  }
}
if (lostRows.length > 0) {
  throw new Error(
    "توقف السكربت: فقدان بيانات فعلي في الجداول التالية (هذا لا يجب أن يحدث أبداً):\n" +
      lostRows.join("\n")
  );
}
console.log("    سليم: لا يوجد أي نقص في عدد الصفوف بأي جدول.");

const finalCols = await client.execute("pragma table_info(circles)");
console.log("\nأعمدة circles النهائية:", finalCols.rows.map((c) => c.name));
const countRes = await client.execute("select count(*) as c from circle_teachers");
console.log("عدد صفوف circle_teachers:", countRes.rows[0].c);

client.close();
