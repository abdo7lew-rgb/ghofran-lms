// نسخة احتياطية كاملة لقاعدة البيانات (قراءة فقط — لا يعدّل شيئاً).
// يحفظ كل الجداول (الهيكل + كل الصفوف) في ملف JSON داخل مجلد backups/.
//
// بدون بيانات TURSO_* : ينسخ dev.db المحلي. مع بيانات TURSO_* : ينسخ القاعدة المحددة (الإنتاج).
import "dotenv/config";
import { createClient } from "@libsql/client";
import { mkdirSync, writeFileSync } from "node:fs";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("متصل بـ:", url);
const client = createClient(authToken ? { url, authToken } : { url });

const tables = await client.execute(
  "select name, sql from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name"
);

const backup = { source: url, takenAt: new Date().toISOString(), tables: {} };
for (const t of tables.rows) {
  const rows = await client.execute(`select * from "${t.name}"`);
  backup.tables[t.name] = { schema: t.sql, rows: rows.rows.map((r) => ({ ...r })) };
  console.log(`  ${t.name}: ${rows.rows.length} صف`);
}

mkdirSync("backups", { recursive: true });
const file = `backups/backup-${backup.takenAt.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(backup, null, 2), "utf8");
console.log("✅ تم حفظ النسخة الاحتياطية في:", file);

client.close();
