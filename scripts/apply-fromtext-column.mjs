// يطبّق تعديل عمود from_ayah ليصبح اختيارياً + إضافة عمود from_text، مباشرة عبر @libsql/client.
// آمن للتكرار (يتحقق قبل التنفيذ). بدون بيانات TURSO_* في .env: يطبّق على dev.db المحلي.
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("متصل بـ:", url);
const client = createClient(authToken ? { url, authToken } : { url });

const cols = await client.execute("pragma table_info(memorization_session_items)");
const fromAyahCol = cols.rows.find((c) => c.name === "from_ayah");
const hasFromText = cols.rows.some((c) => c.name === "from_text");

console.log("from_ayah notnull حالياً؟", fromAyahCol?.notnull === 1);
console.log("from_text موجود؟", hasFromText);

if (fromAyahCol?.notnull === 1) {
  console.log("تعديل from_ayah ليصبح اختيارياً ...");
  await client.execute('ALTER TABLE memorization_session_items ALTER COLUMN "from_ayah" TO "from_ayah" integer');
  console.log("   تم.");
} else {
  console.log("from_ayah اختياري أصلاً، تخطّينا.");
}

if (!hasFromText) {
  console.log("إضافة عمود from_text ...");
  await client.execute("ALTER TABLE memorization_session_items ADD COLUMN from_text text");
  console.log("   تم.");
} else {
  console.log("from_text موجود أصلاً، تخطّينا.");
}

const after = await client.execute("pragma table_info(memorization_session_items)");
console.log("\nالأعمدة النهائية:", after.rows.map((c) => `${c.name}${c.notnull ? "*" : ""}`));

client.close();
