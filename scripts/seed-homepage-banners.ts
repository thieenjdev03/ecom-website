import 'dotenv/config';
import { DataSource } from 'typeorm';
import { HomepageBanner } from '../src/modules/homepage/entities/homepage-banner.entity';

// Initialize data source
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [HomepageBanner],
  synchronize: false,
  logging: true,
});

/**
 * Ice-cream advertising banners.
 *
 * Images are hotlinked from Unsplash (free to use, no attribution required).
 * All URLs were verified to return HTTP 200 image/jpeg and to actually show
 * ice cream / gelato / popsicles. `w=1600` keeps them banner-sized.
 *
 * For production you'd typically re-upload these to Cloudinary via
 * /files/upload and swap image_url — but Unsplash direct links are the same
 * pattern already used by seed-collections.ts.
 */
const bannersData = [
  {
    image_url:
      'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1600&q=80',
    alt_text: 'Assorted gelato cones topped with fresh berries and flowers',
    link_url: '/collections/best-sellers',
    display_order: 0,
    is_active: true,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1600&q=80',
    alt_text: 'Strawberry and vanilla ice cream cone on a bright yellow background',
    link_url: '/collections/new-arrivals',
    display_order: 1,
    is_active: true,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=1600&q=80',
    alt_text: 'Colorful gelato flavors in a shop display case',
    link_url: '/products',
    display_order: 2,
    is_active: true,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=1600&q=80',
    alt_text: 'Chocolate ice cream waffle cones served with coffee beans',
    link_url: '/collections/chocolate',
    display_order: 3,
    is_active: true,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1600&q=80',
    alt_text: 'Berry popsicles stacked with fresh blackberries',
    link_url: '/collections/popsicles',
    display_order: 4,
    is_active: true,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=1600&q=80',
    alt_text: 'Raspberry yogurt popsicles on a marble surface',
    link_url: '/collections/summer',
    display_order: 5,
    is_active: true,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=1600&q=80',
    alt_text: 'Vanilla ice cream scoops with rainbow sprinkles in a sprinkle bowl',
    link_url: '/collections/kids',
    display_order: 6,
    is_active: true,
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=1600&q=80',
    alt_text: 'Double-scoop waffle cone held on a sunny street',
    link_url: '/collections/best-sellers',
    display_order: 7,
    is_active: true,
  },
];

async function seedHomepageBanners() {
  console.log('🌱 Starting homepage banners seed...\n');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const bannerRepository = AppDataSource.getRepository(HomepageBanner);

    // Clear existing banners (soft-delete aware). Comment out to keep existing.
    console.log('🗑️  Clearing existing homepage banners...');
    await bannerRepository.query('DELETE FROM homepage_banners');
    console.log('✅ Cleared existing banners\n');

    console.log('🍦 Creating banners...');
    let created = 0;
    for (const bannerData of bannersData) {
      const banner = bannerRepository.create(bannerData);
      const saved = await bannerRepository.save(banner);
      created++;
      console.log(`   ✓ [order ${saved.display_order}] ${saved.alt_text}`);
    }
    console.log(`✅ Created ${created} homepage banners\n`);

    console.log('🎉 Homepage banners seed completed successfully!\n');
    console.log('📝 You can now:');
    console.log('   - List active banners: GET http://localhost:3000/homepage/banners?active=true');
    console.log('   - List all banners:    GET http://localhost:3000/homepage/banners\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding homepage banners:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seedHomepageBanners();
