import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Career } from '../src/modules/careers/entities/career.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Career],
  synchronize: false,
  logging: true,
});

const careersData: Partial<Career>[] = [
  {
    title: 'Senior Frontend Developer',
    slug: 'senior-frontend-developer',
    category: 'Engineering',
    location: 'Hồ Chí Minh',
    level: 'Senior',
    content:
      '<h2>Mô tả công việc</h2><p>Phát triển storefront Next.js, tối ưu hiệu năng và trải nghiệm người dùng.</p><h2>Yêu cầu</h2><ul><li>3+ năm kinh nghiệm React/Next.js</li><li>Thành thạo TypeScript, Tailwind CSS</li></ul>',
    is_primary: true,
    status: 'published',
    published_at: new Date(),
  },
  {
    title: 'Backend Developer (NestJS)',
    slug: 'backend-developer-nestjs',
    category: 'Engineering',
    location: 'Hồ Chí Minh',
    level: 'Middle',
    content:
      '<h2>Mô tả công việc</h2><p>Xây dựng và bảo trì API cho hệ thống e-commerce với NestJS + PostgreSQL.</p><h2>Yêu cầu</h2><ul><li>2+ năm kinh nghiệm Node.js</li><li>Kinh nghiệm TypeORM, REST API</li></ul>',
    is_primary: true,
    status: 'published',
    published_at: new Date(),
  },
  {
    title: 'UI/UX Designer',
    slug: 'ui-ux-designer',
    category: 'Design',
    location: 'Remote',
    level: 'Middle',
    content:
      '<h2>Mô tả công việc</h2><p>Thiết kế giao diện cho website thương mại điện tử, xây dựng design system.</p><h2>Yêu cầu</h2><ul><li>Thành thạo Figma</li><li>Portfolio về e-commerce là lợi thế</li></ul>',
    is_primary: false,
    status: 'published',
    published_at: new Date(),
  },
  {
    title: 'Digital Marketing Executive',
    slug: 'digital-marketing-executive',
    category: 'Marketing',
    location: 'Hà Nội',
    level: 'Junior',
    content:
      '<h2>Mô tả công việc</h2><p>Lên kế hoạch và triển khai chiến dịch marketing đa kênh (Facebook, Google, TikTok).</p><h2>Yêu cầu</h2><ul><li>1+ năm kinh nghiệm digital marketing</li><li>Biết chạy quảng cáo Facebook/Google Ads</li></ul>',
    is_primary: false,
    status: 'published',
    published_at: new Date(),
  },
  {
    title: 'Customer Support Specialist',
    slug: 'customer-support-specialist',
    category: 'Operations',
    location: 'Hồ Chí Minh',
    level: 'Junior',
    content:
      '<h2>Mô tả công việc</h2><p>Hỗ trợ khách hàng qua chat, email và điện thoại. Xử lý khiếu nại đơn hàng.</p><h2>Yêu cầu</h2><ul><li>Giao tiếp tốt, kiên nhẫn</li><li>Không yêu cầu kinh nghiệm</li></ul>',
    is_primary: false,
    status: 'published',
    published_at: new Date(),
  },
  {
    title: 'DevOps Engineer',
    slug: 'devops-engineer',
    category: 'Engineering',
    location: 'Remote',
    level: 'Senior',
    content:
      '<h2>Mô tả công việc</h2><p>Quản lý hạ tầng cloud, CI/CD pipeline và monitoring cho hệ thống e-commerce.</p><h2>Yêu cầu</h2><ul><li>Kinh nghiệm Docker, Kubernetes</li><li>AWS hoặc GCP</li></ul>',
    is_primary: false,
    status: 'draft',
    published_at: null as unknown as Date,
  },
];

async function seedCareers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const repo = AppDataSource.getRepository(Career);
    const created: Career[] = [];

    for (const data of careersData) {
      let career = await repo.findOne({ where: { slug: data.slug } });
      if (career) {
        console.log(`   ⏭  Skipped (exists): ${data.title}`);
      } else {
        career = await repo.save(repo.create(data));
        console.log(`   ✓ Created: ${data.title}`);
      }
      created.push(career);
    }

    // Link related careers: the two Engineering published jobs reference each other
    const [fe, be] = created;
    fe.subCareers = [be];
    be.subCareers = [fe];
    await repo.save([fe, be]);
    console.log('\n✅ Linked related careers (FE ↔ BE)');

    console.log(`\n🎉 Careers seed completed: ${created.length} careers\n`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding careers:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seedCareers();
