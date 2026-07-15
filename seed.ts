import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

async function main() {
  const name = process.env.SEED_ADMIN_NAME ?? "الشيخ المشرف";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@ghofran.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    console.log(`الحساب موجود بالفعل: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, passwordHash, role: "SUPER_ADMIN" });

  console.log("تم إنشاء حساب الشيخ الرئيسي بنجاح:");
  console.log(`  البريد الإلكتروني: ${email}`);
  console.log(`  كلمة المرور: ${password}`);
  console.log("يُرجى تغيير كلمة المرور بعد أول تسجيل دخول.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
