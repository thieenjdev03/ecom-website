import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/user.entity';
import { Role } from '../src/auth/enums/role.enum';
import * as bcrypt from 'bcrypt';
import dataSource from '../src/database/typeorm.config';

async function main() {
  const ds: DataSource = await dataSource.initialize();
  try {
    const repo = ds.getRepository(User);
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    let admin = await repo.findOne({ where: { email } });
    if (!admin) {
      const passwordHash = await bcrypt.hash(password, 12);
      admin = repo.create({
        email,
        password,
        passwordHash,
        role: Role.ADMIN,
        profile: 'Admin',
      });
      await repo.save(admin);
      // eslint-disable-next-line no-console
      console.log(`Created admin user: ${email}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Admin user already exists: ${email}`);
    }
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


