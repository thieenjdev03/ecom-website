import 'dotenv/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { Brand } from '../src/modules/brands/entities/brand.entity';
import { Category } from '../src/modules/products/entities/category.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { Size } from '../src/modules/sizes/entities/size.entity';

// Không import typeorm.config ở đây: repo còn file .js cũ bật synchronize=true.
// Import catalog tuyệt đối không được tự thay đổi schema database.
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [resolve(__dirname, '../src/modules/**/*.entity.{ts,js}')],
  migrations: [],
  synchronize: false,
  logging: false,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

type Localized = { vi?: string; en?: string };

interface ImportSize {
  key: string;
  name: string;
  categorySlugs: string[];
  unit: string | null;
  packQty: number | null;
  volumeMl: number | null;
  sortOrder: number;
}

interface ImportVariant {
  name: Localized;
  size_key: string;
  sku: string;
  price: number;
  stock: number;
  image_url?: string;
}

interface ImportProduct {
  name: Localized;
  slug: Localized;
  description?: Localized;
  short_description?: Localized;
  price: number;
  sale_price: number | null;
  images: string[];
  variants: ImportVariant[];
  stock_quantity: number;
  sku: string;
  category_slug: string;
  brand_slug: string;
  tags: string[];
  status: 'active' | 'inactive' | 'draft';
  is_featured: boolean;
  enable_sale_tag: boolean;
  meta_title?: Localized;
  meta_description?: Localized;
  weight: number | null;
}

interface ImportCatalog {
  brand: {
    name: string;
    slug: string;
    description?: string;
    display_order: number;
    is_active: boolean;
  };
  categories: Array<{
    name: string;
    slug: string;
    description?: string;
    display_order: number;
  }>;
  sizes: ImportSize[];
  products: ImportProduct[];
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function validateCatalog(catalog: ImportCatalog): void {
  if (!catalog.brand || !catalog.categories?.length || !catalog.sizes?.length || !catalog.products?.length) {
    throw new Error('Catalog thiếu brand, categories, sizes hoặc products.');
  }

  const categorySlugs = catalog.categories.map((item) => item.slug);
  const sizeKeys = catalog.sizes.map((item) => item.key);
  const productSlugs = catalog.products.map((item) => item.slug.vi || item.slug.en || '');
  const productSkus = catalog.products.flatMap((item) => [item.sku, ...item.variants.map((variant) => variant.sku)]);

  if (!unique(categorySlugs) || !unique(sizeKeys) || !unique(productSlugs) || !unique(productSkus)) {
    throw new Error('Catalog có category slug, size key, product slug hoặc SKU bị trùng.');
  }

  const knownCategories = new Set(categorySlugs);
  const knownSizes = new Set(sizeKeys);
  for (const product of catalog.products) {
    if (!knownCategories.has(product.category_slug)) {
      throw new Error(`Product ${product.sku} dùng category không tồn tại: ${product.category_slug}`);
    }
    for (const variant of product.variants) {
      if (!knownSizes.has(variant.size_key)) {
        throw new Error(`Variant ${variant.sku} dùng size không tồn tại: ${variant.size_key}`);
      }
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldApply = args.includes('--apply');
  const fileArg = args.find((arg) => arg.startsWith('--file='));
  const catalogPath = resolve(fileArg?.slice('--file='.length) || 'seeds/mingo-legacy-catalog.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8')) as ImportCatalog;

  validateCatalog(catalog);
  console.log(`Catalog hợp lệ: ${catalog.categories.length} categories, ${catalog.sizes.length} sizes, ${catalog.products.length} products.`);

  if (!shouldApply) {
    console.log('Dry-run hoàn tất. Dùng thêm --apply để ghi database.');
    return;
  }

  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      const brandRepo = manager.getRepository(Brand);
      const categoryRepo = manager.getRepository(Category);
      const sizeRepo = manager.getRepository(Size);
      const productRepo = manager.getRepository(Product);

      let brand = await brandRepo.findOne({ where: { slug: catalog.brand.slug } });
      brand = await brandRepo.save(
        brandRepo.create({
          ...(brand ?? {}),
          ...catalog.brand,
        }),
      );

      const categoryBySlug = new Map<string, Category>();
      for (const input of catalog.categories) {
        const existing = await categoryRepo.findOne({ where: { slug: input.slug } });
        const category = await categoryRepo.save(
          categoryRepo.create({
            ...(existing ?? {}),
            ...input,
            is_active: true,
          }),
        );
        categoryBySlug.set(category.slug, category);
      }

      const sizeIdByKey = new Map<string, string>();
      for (const input of catalog.sizes) {
        const existing = await sizeRepo.findOne({ where: { name: input.name }, relations: ['categories'] });
        const categories = input.categorySlugs.map((slug) => {
          const category = categoryBySlug.get(slug);
          if (!category) throw new Error(`Không tìm thấy category ${slug} khi tạo size ${input.key}`);
          return category;
        });
        const size = await sizeRepo.save(
          sizeRepo.create({
            ...(existing ?? {}),
            name: input.name,
            unit: input.unit,
            packQty: input.packQty,
            volumeMl: input.volumeMl,
            sortOrder: input.sortOrder,
            categories,
          }),
        );
        sizeIdByKey.set(input.key, size.id);
      }

      let created = 0;
      let updated = 0;
      const skipped: string[] = [];
      for (const input of catalog.products) {
        const slug = input.slug.vi || input.slug.en;
        const existing = await productRepo
          .createQueryBuilder('product')
          .where("product.slug->>'vi' = :slug OR product.slug->>'en' = :slug", { slug })
          .getOne();

        if (existing && !existing.tags?.includes('legacy-wp')) {
          skipped.push(slug);
          continue;
        }

        const category = categoryBySlug.get(input.category_slug);
        if (!category) throw new Error(`Không tìm thấy category ${input.category_slug}`);

        const variants = input.variants.map(({ size_key, ...variant }) => {
          const sizeId = sizeIdByKey.get(size_key);
          if (!sizeId) throw new Error(`Không tìm thấy size ${size_key}`);
          return { ...variant, size_id: sizeId };
        });

        const product = productRepo.create({
          ...(existing ?? {}),
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          short_description: input.short_description ?? null,
          price: input.price,
          sale_price: input.sale_price,
          images: input.images,
          variants,
          stock_quantity: input.stock_quantity,
          sku: input.sku,
          category_id: category.id,
          brand_id: brand.id,
          tags: input.tags,
          status: input.status,
          is_featured: input.is_featured,
          enable_sale_tag: input.enable_sale_tag,
          meta_title: input.meta_title ?? null,
          meta_description: input.meta_description ?? null,
          weight: input.weight,
        } as Partial<Product>);
        await productRepo.save(product);
        existing ? updated++ : created++;
      }

      console.log(`Import hoàn tất trong transaction: ${created} created, ${updated} updated, ${skipped.length} skipped.`);
      if (skipped.length) {
        console.log(`Giữ nguyên product hiện có: ${skipped.join(', ')}`);
      }
    });
  } finally {
    await dataSource.destroy();
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exitCode = 1;
});
