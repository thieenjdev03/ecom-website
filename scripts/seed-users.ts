import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/modules/users/user.entity';
import { Role } from '../src/auth/enums/role.enum';

interface SeedUserConfig {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  country?: string;
  phoneNumber?: string;
  profile?: string;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function upsertUser(dataSource: DataSource, config: SeedUserConfig, defaultCountry: string, defaultPhone: string) {
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: config.email } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`ℹ️  User ${config.email} already exists. Skipping.`);
    return existing;
  }

  const passwordHash = await hashPassword(config.password);

  const user = userRepo.create({
    email: config.email,
    passwordHash,
    role: config.role,
    firstName: config.firstName,
    lastName: config.lastName,
    country: config.country ?? defaultCountry,
    phoneNumber: config.phoneNumber ?? defaultPhone,
    profile: config.profile ?? '',
  });

  const saved = await userRepo.save(user);
  // eslint-disable-next-line no-console
  console.log(`✅ Seeded user ${config.email} (${config.role})`);
  return saved;
}

async function run() {
  // Load DataSource: prefer TS config via ts-node; fallback to compiled dist
  let dataSource: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tsConfig = require('../src/database/typeorm.config');
    dataSource = (tsConfig as any)?.default ?? (tsConfig as any);
  } catch (_) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jsConfig = require('../dist/database/typeorm.config');
    dataSource = (jsConfig as any)?.default ?? (jsConfig as any);
  }

  await dataSource.initialize();

  try {
    const defaultCountry = process.env.SEED_USER_COUNTRY ?? 'VN';
    const defaultPhone = process.env.SEED_USER_PHONE ?? '+84900000000';

    const users: SeedUserConfig[] = [
      {
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!@',
        role: Role.ADMIN,
        firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin',
        lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'User',
        country: process.env.SEED_ADMIN_COUNTRY,
        phoneNumber: process.env.SEED_ADMIN_PHONE,
        profile: 'Seeded administrator account',
      },
      {
        email: process.env.SEED_USER_EMAIL ?? 'user@example.com',
        password: process.env.SEED_USER_PASSWORD ?? 'User123!@',
        role: Role.USER,
        firstName: process.env.SEED_USER_FIRST_NAME ?? 'Demo',
        lastName: process.env.SEED_USER_LAST_NAME ?? 'Customer',
        country: process.env.SEED_USER_COUNTRY,
        phoneNumber: process.env.SEED_USER_PHONE,
        profile: 'Seeded customer account',
      },
    ];

    for (const user of users) {
      await upsertUser(dataSource, user, defaultCountry, defaultPhone);
    }

    // eslint-disable-next-line no-console
    console.log('🎉 User seeding finished.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ User seeding failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Fatal error during user seeding:', error);
  process.exit(1);
});
