import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from '../src/database/typeorm.config';
import { User } from '../src/modules/users/user.entity';
import { Role } from '../src/auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

async function run() {
  const ds: DataSource = await dataSource.initialize();
  try {
    const userRepo = ds.getRepository(User);

    const seedSpecs: Array<{ email: string; password: string; role?: Role; profile?: string; phoneNumber?: string }> = [
      { email: 'alice@example.com', password: 'Password@123', role: Role.USER, profile: 'Alice', phoneNumber: '0900000001' },
      { email: 'bob@example.com', password: 'Password@123', role: Role.USER, profile: 'Bob', phoneNumber: '0900000002' },
      { email: 'charlie@example.com', password: 'Password@123', role: Role.USER, profile: 'Charlie', phoneNumber: '0900000003' },
      { email: 'diana@example.com', password: 'Password@123', role: Role.USER, profile: 'Diana', phoneNumber: '0900000004' },
      { email: 'eva@example.com', password: 'Password@123', role: Role.USER, profile: 'Eva', phoneNumber: '0900000005' },
    ];

    for (const spec of seedSpecs) {
      const exists = await userRepo.findOne({ where: { email: spec.email } });
      if (exists) continue;

      const passwordHash = await bcrypt.hash(spec.password, 12);
      const entity = userRepo.create({
        email: spec.email,
        passwordHash,
        role: spec.role ?? Role.USER,
        profile: spec.profile ?? '',
        phoneNumber: spec.phoneNumber,
      });
      await userRepo.save(entity);
    }

    // eslint-disable-next-line no-console
    console.log('✅ Seeded users successfully');
  } finally {
    await ds.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


