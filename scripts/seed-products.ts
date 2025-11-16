import 'dotenv/config';
import { productSeeder } from '../src/seeds/product.seed';

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

async function run() {
  await dataSource.initialize();
  try {
    // Get total from command line argument or default to 20
    const total = process.argv[2] ? parseInt(process.argv[2], 10) : 20;
    console.log(`🌱 Seeding ${total} products...\n`);
    await productSeeder(dataSource, total);
    // eslint-disable-next-line no-console
    console.log('\n🎉 Product seeding completed');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Product seeding failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


