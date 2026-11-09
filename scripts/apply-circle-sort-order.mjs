// يضيف عمود sort_order لجدول circles (ترتيب الحلقات الذي يحدده الشيخ الرئيسي) مباشرة عبر @libsql/client.
// إضافة فقط — لا يحذف ولا يعدّل أي بيانات موجودة. آمن للتكرار (يتحقق من وجود العمود أولاً).
// عند الإضافة لأول مرة يُعطى لكل حلقة ترتيب يساوي رقمها (id) فيبقى الترتيب الحالي كما هو.
//
// بدون بيانات TURSO_* في .env: يطبّق على dev.db المحلي.
// مع بيانات TURSO_* في .env: يطبّق على القاعدة المحددة (الإنتاج).
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("متصل بـ:", url);
const client = createClient(authToken ? { url, authToken } : { url });

const before = await client.execute("select count(*) as n from circles");
console.log("عدد الحلقات:", before.rows[0].n);

const cols = await client.execute("pragma table_info(circles)");
const hasColumn = cols.rows.some((c) => c.name === "sort_order");

if (hasColumn) {
  console.log("✅ العمود sort_order موجود أصلاً. لا داعي لأي تعديل.");
} else {
  console.log("إضافة عمود sort_order ...");
  await client.batch(
    [
      "ALTER TABLE circles ADD COLUMN sort_order integer NOT NULL DEFAULT 0",
      "UPDATE circles SET sort_order = id",
    ],
    "write"
  );
  console.log("✅ تم بنجاح.");
}

const after = await client.execute("select id, name, sort_order from circles order by sort_order, id");
console.table(after.rows.map((r) => ({ id: r.id, name: r.name, sort_order: r.sort_order })));

client.close();
