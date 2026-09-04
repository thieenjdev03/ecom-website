import * as bcrypt from "bcrypt";
import dataSource from "../database/typeorm.config";

/**
 * Tạo tài khoản admin đầu tiên khi deploy, đọc từ SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 * Idempotent: email đã tồn tại thì không đụng tới (không reset mật khẩu ở mỗi lần deploy),
 * và ON CONFLICT giữ đúng kể cả khi nhiều instance khởi động cùng lúc.
 */
export async function seedAdminFromEnv(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("[seed] SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD chưa đặt, bỏ qua.");
    return;
  }
  if (password.length < 12) {
    throw new Error("[seed] SEED_ADMIN_PASSWORD phải dài tối thiểu 12 ký tự.");
  }

  const ownsConnection = !dataSource.isInitialized;
  if (ownsConnection) await dataSource.initialize();

  try {
    const inserted = await dataSource.query(
      `INSERT INTO "user" (email, "firstName", "lastName", country, "phoneNumber", "passwordHash", role, profile)
       VALUES ($1, $2, $3, 'VN', $4, $5, 'admin', 'Seeded administrator account')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [
        email,
        process.env.SEED_ADMIN_FIRST_NAME ?? "Admin",
        process.env.SEED_ADMIN_LAST_NAME ?? "User",
        process.env.SEED_ADMIN_PHONE ?? "+84900000000",
        await bcrypt.hash(password, 12),
      ],
    );
    console.log(
      inserted.length
        ? `[seed] Đã tạo admin ${email}.`
        : `[seed] Admin ${email} đã tồn tại, giữ nguyên.`,
    );
  } finally {
    if (ownsConnection && dataSource.isInitialized) await dataSource.destroy();
  }
}

if (require.main === module) {
  seedAdminFromEnv().catch((error) => {
    console.error("[seed] Seed admin thất bại.", error);
    process.exitCode = 1;
  });
}
