// يضيف عمود left_at لجدول students (تاريخ إلغاء الطالب من الحلقة) مباشرة عبر @libsql/client.
// إضافة فقط — لا يحذف ولا يعدّل أي بيانات موجودة. كل الطلبة الحاليين يبقون نشطين (left_at فارغ).
// آمن للتكرار (يتحقق من وجود العمود أولاً).
//
// بدون بيانات TURSO_* في .env: يطبّق على dev.db المحلي.
// مع بيانات TURSO_* في .env: يطبّق على القاعدة المحددة (الإنتاج).
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("متصل بـ:", url);
const client = createClient(authToken ? { url, authToken } : { url });

const before = await client.execute("select count(*) as n from students");
console.log("عدد الطلبة:", before.rows[0].n);

const cols = await client.execute("pragma table_info(students)");
const hasColumn = cols.rows.some((c) => c.name === "left_at");

if (hasColumn) {
  console.log("✅ العمود left_at موجود أصلاً. لا داعي لأي تعديل.");
} else {
  console.log("إضافة عمود left_at ...");
  await client.execute("ALTER TABLE students ADD COLUMN left_at text");
  console.log("✅ تم بنجاح.");
}

const after = await client.execute(
  "select count(*) as total, sum(left_at is null) as active from students"
);
console.log("عدد الطلبة بعد التعديل:", after.rows[0].total, "— النشطون:", after.rows[0].active);

client.close();
