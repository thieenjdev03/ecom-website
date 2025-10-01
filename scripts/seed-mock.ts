import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from '../src/database/typeorm.config';
import { User } from '../src/modules/users/user.entity';
import { Address } from '../src/modules/addresses/address.entity';
import { Role } from '../src/auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const ds: DataSource = await dataSource.initialize();
  try {
    const userRepo = ds.getRepository(User);
    const addrRepo = ds.getRepository(Address);

    // Seed 5 users
    for (let i = 1; i <= 5; i++) {
      const email = `user${i}@example.com`;
      const exists = await userRepo.findOne({ where: { email } });
      if (!exists) {
        const password = 'Password@123';
        const passwordHash = await bcrypt.hash(password, 12);
        const user = userRepo.create({
          email,
          password,
          passwordHash,
          role: Role.USER,
          profile: `Mock User ${i}`,
        });
        await userRepo.save(user);
      }
    }

    const users = await userRepo.find();
    const provinces = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'];
    const districts = ['Quận 1', 'Hoàn Kiếm', 'Hải Châu'];

    for (const user of users) {
      // Create 2 addresses each
      for (let j = 1; j <= 2; j++) {
        const label = j === 1 ? 'Home' : 'Work';
        const existing = await addrRepo.findOne({ where: { userId: user.id as string, label } });
        if (!existing) {
          const addr = addrRepo.create({
            userId: user.id as string,
            recipientName: user.profile || 'Nguyen Van A',
            recipientPhone: '0912345678',
            label,
            countryCode: 'VN',
            province: randomFrom(provinces),
            district: randomFrom(districts),
            ward: 'Phường 1',
            streetLine1: `${100 + j} Đường ABC`,
            streetLine2: j === 2 ? 'Tầng 5' : null,
            postalCode: '100000',
            latitude: 21.028511,
            longitude: 105.804817,
            isShipping: true,
            isBilling: j === 2,
            isDefault: j === 1,
            note: j === 2 ? 'Giao giờ hành chính' : null,
          });
          await addrRepo.save(addr);
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log('✅ Seeded mock users and addresses');
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


