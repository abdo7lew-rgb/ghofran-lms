// سكريبت طوارئ: يطبّق migration المقاطع المتعددة يدوياً ومباشرة على قاعدة بيانات
// الإنتاج (Turso)، بلا الاعتماد على جدول تتبّع drizzle-kit، ويطبع تفاصيل كل خطوة
// حتى نتأكد فعلياً شنو صار (بدل الصمت اللي كنا نشوفه مع drizzle-kit migrate).
//
// طريقة التشغيل: حط بيانات الإنتاج الحقيقية في .env مؤقتاً (TURSO_DATABASE_URL و
// TURSO_AUTH_TOKEN)، وبعدين شغّل: npx tsx scripts/manual-fix-production-db.mjs
// ولا تنسَ ترجّع .env فاضي بعدها.

import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("خطأ: TURSO_DATABASE_URL غير موجود أو غير صحيح في .env. توقفت بدون أي تغيير.");
  process.exit(1);
}
if (!authToken) {
  console.error("خطأ: TURSO_AUTH_TOKEN غير موجود في .env. توقفت بدون أي تغيير.");
  process.exit(1);
}

console.log("متصل بـ:", url);
const client = createClient({ url, authToken });

async function tableExists(name) {
  const res = await client.execute({
    sql: "select name from sqlite_master where type='table' and name=?",
    args: [name],
  });
  return res.rows.length > 0;
}

async function main() {
  console.log("\n--- الجداول الموجودة حالياً ---");
  const before = await client.execute("select name from sqlite_master where type='table' order by name");
  for (const r of before.rows) console.log(" -", r.name);

  const itemsExists = await tableExists("memorization_session_items");
  const oldExists = await tableExists("memorization_sessions_old");
  const sessionsHasOldCols = await client
    .execute("select surah_number from memorization_sessions limit 1")
    .then(() => true)
    .catch(() => false);

  console.log("\nmemorization_session_items موجود؟", itemsExists);
  console.log("memorization_sessions فيها أعمدة قديمة (surah_number)؟", sessionsHasOldCols);
  console.log("memorization_sessions_old (بقايا migration منتصفة)؟", oldExists);

  if (itemsExists && !sessionsHasOldCols) {
    console.log("\n✅ الجدول موجود فعلاً والبنية صحيحة. لا داعي لأي تعديل.");
    return;
  }

  if (oldExists) {
    console.log("\n⚠️ فيه جدول memorization_sessions_old متبقّي من محاولة سابقة متوقفة في النص.");
    console.log("راح نكمّل من حيث توقف بدل ما نبدأ من الصفر.");
  }

  console.log("\n--- تطبيق التعديلات ---");

  // خطوة 1: إعادة تسمية الجدول القديم (فقط لو لسا فيه الأعمدة القديمة ومافيش نسخة _old موجودة)
  if (sessionsHasOldCols && !oldExists) {
    console.log("1) إعادة تسمية memorization_sessions -> memorization_sessions_old ...");
    await client.execute("ALTER TABLE memorization_sessions RENAME TO memorization_sessions_old");
    console.log("   تم.");
  }

  // خطوة 2: إنشاء الجدول الجديد memorization_sessions (بدون الأعمدة القديمة) لو مش موجود
  const newSessionsExists = await tableExists("memorization_sessions");
  if (!newSessionsExists) {
    console.log("2) إنشاء جدول memorization_sessions الجديد ...");
    await client.execute(`CREATE TABLE memorization_sessions (
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
    console.log("   تم.");
  } else {
    console.log("2) جدول memorization_sessions الجديد موجود أصلاً، تخطّينا الإنشاء.");
  }

  // خطوة 3: إنشاء جدول المقاطع لو مش موجود
  if (!itemsExists) {
    console.log("3) إنشاء جدول memorization_session_items ...");
    await client.execute(`CREATE TABLE memorization_session_items (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	session_id integer NOT NULL,
	surah_number integer NOT NULL,
	from_ayah integer NOT NULL,
	to_ayah integer NOT NULL,
	rating text,
	sort_order integer DEFAULT 0 NOT NULL,
	created_at text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (session_id) REFERENCES memorization_sessions(id) ON UPDATE no action ON DELETE cascade
)`);
    console.log("   تم.");
  } else {
    console.log("3) جدول memorization_session_items موجود أصلاً، تخطّينا الإنشاء.");
  }

  // خطوة 4: نقل البيانات من الجدول القديم، فقط لو فيه بيانات لسا ما انتقلتش
  if (oldExists || sessionsHasOldCols) {
    const alreadyMigrated = await client
      .execute("select count(*) as c from memorization_sessions")
      .then((r) => Number(r.rows[0].c) > 0);

    if (!alreadyMigrated) {
      console.log("4) نقل بيانات الجلسات من memorization_sessions_old ...");
      await client.execute(`INSERT INTO memorization_sessions (id, student_id, date, session_type, notes, recorded_by, created_at)
        SELECT id, student_id, date, session_type, notes, recorded_by, created_at FROM memorization_sessions_old`);
      console.log("   تم نقل الجلسات.");

      console.log("   نقل المقاطع (كل صف قديم يصير مقطع واحد) ...");
      await client.execute(`INSERT INTO memorization_session_items (session_id, surah_number, from_ayah, to_ayah, rating, sort_order)
        SELECT id, surah_number, from_ayah, to_ayah, rating, 0 FROM memorization_sessions_old`);
      console.log("   تم نقل المقاطع.");
    } else {
      console.log("4) البيانات منقولة أصلاً، تخطّينا هذي الخطوة.");
    }

    console.log("5) حذف الجدول القديم memorization_sessions_old ...");
    await client.execute("DROP TABLE IF EXISTS memorization_sessions_old");
    console.log("   تم.");
  }

  console.log("\n--- الجداول بعد التعديل ---");
  const after = await client.execute("select name from sqlite_master where type='table' order by name");
  for (const r of after.rows) console.log(" -", r.name);

  const sessionsCount = await client.execute("select count(*) as c from memorization_sessions");
  const itemsCount = await client.execute("select count(*) as c from memorization_session_items");
  console.log("\nعدد الجلسات:", sessionsCount.rows[0].c);
  console.log("عدد المقاطع:", itemsCount.rows[0].c);
  console.log("\n✅ خلصنا بنجاح.");
}

main()
  .catch((err) => {
    console.error("\n❌ صار خطأ:", err);
    process.exit(1);
  })
  .finally(() => client.close());
