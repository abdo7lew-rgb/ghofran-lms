// يطبّق العمود الجديد to_surah_number مباشرة عبر @libsql/client (تفادياً لمشكلة dialect: "turso" في
// drizzle-kit التي تتطلب authToken حتى لملف SQLite محلي). آمن للتكرار (يتحقق من عدم وجود العمود أولاً).
//
// بدون بيانات TURSO_* في .env: يطبّق على dev.db المحلي.
// مع بيانات TURSO_* في .env: يطبّق على قاعدة الإنتاج.
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("متصل بـ:", url);
const client = createClient(authToken ? { url, authToken } : { url });

const cols = await client.execute("pragma table_info(memorization_session_items)");
const hasColumn = cols.rows.some((c) => c.name === "to_surah_number");

if (hasColumn) {
  console.log("✅ العمود to_surah_number موجود أصلاً. لا داعي لأي تعديل.");
} else {
  console.log("إضافة عمود to_surah_number ...");
  await client.execute("ALTER TABLE memorization_session_items ADD COLUMN to_surah_number integer");
  console.log("✅ تم بنجاح.");
}

client.close();
