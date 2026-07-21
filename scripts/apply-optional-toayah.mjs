// يطبّق تعديل عمود to_ayah ليصبح اختيارياً (يمكن تسجيل جلسة برأس المقطع فقط دون تحديد نهايته)،
// مباشرة عبر @libsql/client. آمن للتكرار (يتحقق قبل التنفيذ).
// بدون بيانات TURSO_* في .env: يطبّق على dev.db المحلي.
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("متصل بـ:", url);
const client = createClient(authToken ? { url, authToken } : { url });

const cols = await client.execute("pragma table_info(memorization_session_items)");
const toAyahCol = cols.rows.find((c) => c.name === "to_ayah");

console.log("to_ayah notnull حالياً؟", toAyahCol?.notnull === 1);

if (toAyahCol?.notnull === 1) {
  console.log("تعديل to_ayah ليصبح اختيارياً ...");
  await client.execute('ALTER TABLE memorization_session_items ALTER COLUMN "to_ayah" TO "to_ayah" integer');
  console.log("   تم.");
} else {
  console.log("to_ayah اختياري أصلاً، تخطّينا.");
}

const after = await client.execute("pragma table_info(memorization_session_items)");
console.log("\nالأعمدة النهائية:", after.rows.map((c) => `${c.name}${c.notnull ? "*" : ""}`));

const countBefore = await client.execute("select count(*) as c from memorization_session_items");
console.log("عدد الصفوف بعد التعديل (يجب أن يبقى كما هو):", countBefore.rows[0].c);

client.close();
