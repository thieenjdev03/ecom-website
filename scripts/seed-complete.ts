import 'dotenv/config';
import { completeSeeder } from '../src/seeds/complete.seed';

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
    await completeSeeder(dataSource);
    // eslint-disable-next-line no-console
    console.log('🎉 Complete seeding completed');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Complete seeding failed:', error);
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
