import 'dotenv/config';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

// ----------------------------------------------------------------------
// Seed brands + packaging specs (quy cách) and randomly attach them to
// existing products.
//
//   1. Upsert a pool of ice-cream "quy cách" (sizes) — idempotent by name.
//   2. Upsert sample brands — idempotent by slug.
//   3. For every active product:
//        - if brand_id is NULL   -> assign a random brand.
//        - if variants is empty  -> generate 2–3 random variants picked from
//          the size pool appropriate to the product's category, with prices
//          derived from the product's base price.
//
// Uses raw SQL (not the entity repositories) on purpose: the Product entity
// currently declares a `nutrition_information` column that may not exist in the
// DB yet (pending migration), which would break repository reads.
//
// Re-runnable: never overwrites an existing brand link or existing variants.
// Run: npx ts-node -r tsconfig-paths/register ./scripts/seed-brands-and-specs.ts
// ----------------------------------------------------------------------

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [],
  synchronize: false,
  logging: false,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

// --- Size (quy cách) pool -------------------------------------------------
type SizeSeed = {
  name: string;
  unit: string | null;
  packQty: number | null;
  volumeMl: number | null;
  sortOrder: number;
  factor: number; // price multiplier relative to the product base price
  code: string; // short token for SKU
};

const SIZE_POOL: SizeSeed[] = [
  { name: 'Ly 100ml', unit: 'ly', packQty: null, volumeMl: 100, sortOrder: 10, factor: 0.8, code: 'LY100' },
  { name: 'Ly 160ml', unit: 'ly', packQty: null, volumeMl: 160, sortOrder: 11, factor: 1.1, code: 'LY160' },
  { name: 'Cây 60ml', unit: 'cây', packQty: null, volumeMl: 60, sortOrder: 20, factor: 0.7, code: 'CAY60' },
  { name: 'Cây 90ml', unit: 'cây', packQty: null, volumeMl: 90, sortOrder: 21, factor: 0.9, code: 'CAY90' },
  { name: 'Ốc quế 90ml', unit: 'ốc quế', packQty: null, volumeMl: 90, sortOrder: 30, factor: 1.0, code: 'OQ90' },
  { name: 'Hộp 250ml', unit: 'hộp', packQty: null, volumeMl: 250, sortOrder: 40, factor: 1.0, code: 'H250' },
  { name: 'Hộp 500ml', unit: 'hộp', packQty: null, volumeMl: 500, sortOrder: 41, factor: 1.6, code: 'H500' },
  { name: 'Hộp 1 lít', unit: 'hộp', packQty: null, volumeMl: 1000, sortOrder: 42, factor: 2.6, code: 'H1L' },
  { name: 'Pint 473ml', unit: 'hộp', packQty: null, volumeMl: 473, sortOrder: 43, factor: 1.5, code: 'PINT' },
  { name: '6 cây / lốc', unit: 'cây', packQty: 6, volumeMl: null, sortOrder: 50, factor: 6 * 0.7 * 0.9, code: '6CAY' },
  { name: '6 hộp / thùng', unit: 'hộp', packQty: 6, volumeMl: null, sortOrder: 51, factor: 6 * 1.0 * 0.9, code: '6HOP' },
  { name: '12 hộp / thùng', unit: 'hộp', packQty: 12, volumeMl: null, sortOrder: 52, factor: 12 * 1.0 * 0.9, code: '12HOP' },
  { name: '24 cây / thùng', unit: 'cây', packQty: 24, volumeMl: null, sortOrder: 53, factor: 24 * 0.7 * 0.9, code: '24CAY' },
];

// Which size names suit which category slug (fallback = whole pool).
const CATEGORY_SIZES: Record<string, string[]> = {
  pint: ['Hộp 250ml', 'Hộp 500ml', 'Hộp 1 lít', 'Pint 473ml', '6 hộp / thùng', '12 hộp / thùng'],
  cup: ['Ly 100ml', 'Ly 160ml', 'Hộp 250ml'],
  cone: ['Ốc quế 90ml', 'Cây 90ml'],
  'big-bite': ['Cây 60ml', 'Cây 90ml', '6 cây / lốc', '24 cây / thùng'],
  oasis: ['Cây 60ml', 'Cây 90ml', 'Ly 100ml', '24 cây / thùng'],
  'extreme-chocolate': ['Hộp 250ml', 'Hộp 500ml', 'Cây 90ml'],
};

// --- Brand samples --------------------------------------------------------
const BRAND_POOL = [
  { name: 'Mingo', slug: 'mingo', description: 'Thương hiệu kem tươi chủ lực của Mingo.', display_order: 1 },
  { name: 'Mingo Premium', slug: 'mingo-premium', description: 'Dòng kem cao cấp, nguyên liệu chọn lọc.', display_order: 2 },
  { name: 'Rokka', slug: 'rokka', description: 'Kem ốc quế giòn rụm phong cách Nhật Bản.', display_order: 3 },
  { name: 'Oasis', slug: 'oasis', description: 'Kem que trái cây mát lạnh, vị tự nhiên.', display_order: 4 },
  { name: 'Big Bite', slug: 'big-bite', description: 'Kem que phủ socola, khẩu phần lớn.', display_order: 5 },
  { name: 'Celano', slug: 'celano', description: 'Dòng kem hộp mềm mịn, đa dạng hương vị.', display_order: 6 },
];

const rand = (n: number) => Math.floor(Math.random() * n);
const pickSome = <T,>(arr: T[], min: number, max: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const k = Math.min(arr.length, min + rand(max - min + 1));
  return shuffled.slice(0, k);
};
const roundThousand = (v: number) => Math.max(1000, Math.round(v / 1000) * 1000);

async function main() {
  await ds.initialize();
  console.log('✅ Database connected\n');

  // 1) Upsert sizes -------------------------------------------------------
  const sizeIdByName = new Map<string, string>();
  let sizesCreated = 0;
  for (const s of SIZE_POOL) {
    const [existing] = await ds.query('SELECT id FROM sizes WHERE name = $1 LIMIT 1', [s.name]);
    if (existing) {
      sizeIdByName.set(s.name, existing.id);
      continue;
    }
    const id = randomUUID();
    await ds.query(
      `INSERT INTO sizes (id, name, unit, pack_qty, volume_ml, sort_order, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6, now(), now())`,
      [id, s.name, s.unit, s.packQty, s.volumeMl, s.sortOrder],
    );
    sizeIdByName.set(s.name, id);
    sizesCreated += 1;
    console.log(`   ✓ Size created: ${s.name}`);
  }
  console.log(`\n📦 Sizes: ${sizesCreated} created / ${SIZE_POOL.length} in pool\n`);

  const sizeMeta = new Map(SIZE_POOL.map((s) => [s.name, s]));

  // 2) Upsert brands ------------------------------------------------------
  const brandIds: string[] = [];
  let brandsCreated = 0;
  for (const b of BRAND_POOL) {
    const [existing] = await ds.query('SELECT id FROM brands WHERE slug = $1 LIMIT 1', [b.slug]);
    if (existing) {
      brandIds.push(existing.id);
      continue;
    }
    const id = randomUUID();
    await ds.query(
      `INSERT INTO brands (id, name, slug, logo_url, description, display_order, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,true, now(), now())`,
      [id, b.name, b.slug, null, b.description, b.display_order],
    );
    brandIds.push(id);
    brandsCreated += 1;
    console.log(`   ✓ Brand created: ${b.name}`);
  }
  console.log(`\n🏷️  Brands: ${brandsCreated} created / ${BRAND_POOL.length} in pool\n`);

  // 3) Category slug map --------------------------------------------------
  const cats = await ds.query('SELECT id, slug FROM categories');
  const slugByCatId = new Map<string, string>(cats.map((c: any) => [c.id, String(c.slug)]));

  // 4) Attach to products -------------------------------------------------
  const products = await ds.query(
    `SELECT id, name, category_id, price, brand_id, COALESCE(variants,'[]'::jsonb) AS variants
     FROM products WHERE deleted_at IS NULL`,
  );

  let brandAssigned = 0;
  let variantsAssigned = 0;

  for (const p of products) {
    const base = parseFloat(p.price) || 25000;
    const catSlug = p.category_id ? slugByCatId.get(p.category_id) : undefined;
    const groupNames = (catSlug && CATEGORY_SIZES[catSlug]) || SIZE_POOL.map((s) => s.name);
    const currentVariants = Array.isArray(p.variants) ? p.variants : [];

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // Brand (only if missing)
    let assignBrand = false;
    if (!p.brand_id && brandIds.length) {
      const brandId = brandIds[rand(brandIds.length)];
      sets.push(`brand_id = $${idx++}`);
      params.push(brandId);
      assignBrand = true;
    }

    // Variants (only if empty)
    let assignVariants = false;
    if (currentVariants.length === 0) {
      const chosen = pickSome(groupNames, 2, 3);
      const shortId = String(p.id).replace(/-/g, '').slice(0, 5).toUpperCase();
      const variants = chosen.map((name) => {
        const meta = sizeMeta.get(name)!;
        const jitter = 0.95 + Math.random() * 0.1; // ±5%
        const price = roundThousand(base * meta.factor * jitter);
        return {
          name: { vi: name, en: name },
          size_id: sizeIdByName.get(name),
          sku: `MG-${shortId}-${meta.code}`,
          price,
          stock: 20 + rand(181), // 20–200
        };
      });
      sets.push(`variants = $${idx++}::jsonb`);
      params.push(JSON.stringify(variants));
      assignVariants = true;
    }

    if (sets.length === 0) continue;

    params.push(p.id);
    await ds.query(`UPDATE products SET ${sets.join(', ')}, updated_at = now() WHERE id = $${idx}`, params);
    if (assignBrand) brandAssigned += 1;
    if (assignVariants) variantsAssigned += 1;
  }

  console.log(`🎉 Products updated: brand assigned to ${brandAssigned}, variants added to ${variantsAssigned} (of ${products.length})\n`);

  await ds.destroy();
}

main().catch(async (e) => {
  console.error('❌ Error:', e.message || e);
  await ds.destroy();
  process.exit(1);
});
