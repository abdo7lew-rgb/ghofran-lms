// يبسّط تقييم الأداء من نظام خماسي (ممتاز/جيد جداً/جيد/مقبول/ضعيف) إلى نظام ثنائي (حافظ/لم يحفظ).
// التحويل: الأربع درجات الإيجابية (EXCELLENT, VERY_GOOD, GOOD, ACCEPTABLE) → MEMORIZED،
// والدرجة الأضعف (WEAK) → NOT_MEMORIZED. لا حاجة لتعديل بنية الجدول (rating نص عادي بلا قيد CHECK)،
// فقط تحديث القيم المخزَّنة. آمن للتكرار: بعد أول تشغيل لن تبقى أي قيم قديمة لتُحدَّث.
// بدون بيانات TURSO_* في .env: يطبّق على dev.db المحلي.
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("متصل بـ:", url);
const client = createClient(authToken ? { url, authToken } : { url });

const before = await client.execute(
  "select rating, count(*) as c from memorization_session_items group by rating"
);
console.log("توزيع التقييمات قبل التحديث:", JSON.stringify(before.rows));

const totalBefore = await client.execute("select count(*) as c from memorization_session_items");

const toMemorized = await client.execute(
  "update memorization_session_items set rating = 'MEMORIZED' where rating in ('EXCELLENT','VERY_GOOD','GOOD','ACCEPTABLE')"
);
console.log("عدد الصفوف المحدَّثة إلى MEMORIZED:", toMemorized.rowsAffected);

const toNotMemorized = await client.execute(
  "update memorization_session_items set rating = 'NOT_MEMORIZED' where rating = 'WEAK'"
);
console.log("عدد الصفوف المحدَّثة إلى NOT_MEMORIZED:", toNotMemorized.rowsAffected);

const totalAfter = await client.execute("select count(*) as c from memorization_session_items");
if (Number(totalAfter.rows[0].c) !== Number(totalBefore.rows[0].c)) {
  throw new Error("توقف: عدد الصفوف تغيّر أثناء التحديث، هذا لا يجب أن يحدث أبداً");
}

const after = await client.execute(
  "select rating, count(*) as c from memorization_session_items group by rating"
);
console.log("توزيع التقييمات بعد التحديث:", JSON.stringify(after.rows));
console.log("عدد الصفوف الإجمالي (يجب أن يبقى كما هو):", totalAfter.rows[0].c);

client.close();
