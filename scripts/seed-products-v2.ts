/* eslint-disable no-console */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import ormConfig from '../src/database/typeorm.config';
import { Product } from '../src/modules/products/product.entity';
import { ProductVariant } from '../src/modules/products/entity/product-variant.entity';
import { ProductAttribute } from '../src/modules/products/entity/product-attribute.entity';
import { ProductMedia } from '../src/modules/products/entity/product-media.entity';

type VarSpec = {
  sku: string;
  name: string | null;
  priceOriginal: number;
  priceFinal: number;
  stock: number;
  thumbnailUrl?: string | null;
};

async function seedOneProduct(ds: DataSource, p: Partial<Product>, vars: VarSpec[], attrs: {key:string; value:string}[], media: Partial<ProductMedia>[]) {
  const productRepo = ds.getRepository(Product);
  const variantRepo = ds.getRepository(ProductVariant);
  const attrRepo = ds.getRepository(ProductAttribute);
  const mediaRepo = ds.getRepository(ProductMedia);

  // create product
  const product = productRepo.create({
    title: p.title!,
    slug: p.slug!,
    description: p.description ?? null,
    status: p.status ?? 'published',
    price: String(p.price ?? 0),
    priceOriginal: String(p.priceOriginal ?? 0),
    attribute: p.attribute ?? '',
  });
  await productRepo.save(product);

  // variants
  const variantIds: string[] = [];
  for (const v of vars) {
    const variant = variantRepo.create({
      productId: product.id,
      sku: v.sku,
      name: v.name ?? null,
      priceOriginal: String(v.priceOriginal),
      priceFinal: String(v.priceFinal),
      currency: 'VND',
      stockOnHand: v.stock,
      stockReserved: 0,
      thumbnailUrl: v.thumbnailUrl ?? null,
    });
    await variantRepo.save(variant);
    variantIds.push(variant.id);
  }

  // defaultVariantId = variant đầu tiên
  await productRepo.update(product.id, { defaultVariantId: variantIds[0] });

  // attributes
  for (const a of attrs) {
    const attr = attrRepo.create({
      productId: product.id,
      key: a.key,
      value: a.value,
    });
    await attrRepo.save(attr);
  }

  // media
  let position = 0;
  for (const m of media) {
    const mrow = mediaRepo.create({
      productId: product.id,
      url: m.url!,
      type: (m.type ?? 'image') as any,
      position: m.position ?? position++,
      isPrimary: !!m.isPrimary,
      isHover: !!m.isHover,
      variantId: m.variantId ?? null,
      alt: m.alt ?? null,
    });
    await mediaRepo.save(mrow);
  }

  console.log(`✔ Seeded product: ${product.title} (${vars.length} variants)`);
}

async function run() {
  const ds = new DataSource((ormConfig as any).options);
  await ds.initialize();

  // Clear existing data to avoid conflicts
  console.log('Clearing existing product data...');
  await ds.query('DELETE FROM product_media');
  await ds.query('DELETE FROM product_attributes');
  await ds.query('DELETE FROM product_variants');
  await ds.query('DELETE FROM products');

  // === Product 1: Premium Hoodie ===
  await seedOneProduct(
    ds,
    {
      title: 'Premium Hoodie',
      slug: 'premium-hoodie',
      description: 'Comfortable and stylish hoodie',
      status: 'published',
      price: '0',
      priceOriginal: '0',
    },
    [
      { sku: 'HOODIE-BLACK-M-COTTON', name: 'Black / M / Cotton', priceOriginal: 450000, priceFinal: 350000, stock: 20 },
      { sku: 'HOODIE-BLACK-L-COTTON', name: 'Black / L / Cotton', priceOriginal: 450000, priceFinal: 350000, stock: 15 },
      { sku: 'HOODIE-GREY-M-COTTON',  name: 'Grey / M / Cotton',  priceOriginal: 450000, priceFinal: 339000, stock: 18 },
    ],
    [
      { key: 'Brand', value: 'Premium Co.' },
      { key: 'Material', value: 'Cotton' },
      { key: 'Weight', value: '500g' },
      { key: 'Color', value: 'Black,Grey' },
      { key: 'Size', value: 'M,L' },
    ],
    [
      { url: 'https://picsum.photos/seed/hoodie1/800', isPrimary: true, position: 0, alt: 'Hoodie front' },
      { url: 'https://picsum.photos/seed/hoodie2/800', isHover: true, position: 1, alt: 'Hoodie hover' },
    ]
  );

  // === Product 2: Classic T-Shirt ===
  await seedOneProduct(
    ds,
    {
      title: 'Classic T-Shirt',
      slug: 'classic-tshirt',
      description: '100% cotton classic tee',
      status: 'published',
      price: '0',
      priceOriginal: '0',
    },
    [
      { sku: 'TS-RED-M',  name: 'Red / M',  priceOriginal: 199000, priceFinal: 159000, stock: 50 },
      { sku: 'TS-RED-L',  name: 'Red / L',  priceOriginal: 199000, priceFinal: 159000, stock: 40 },
      { sku: 'TS-BLUE-M', name: 'Blue / M', priceOriginal: 199000, priceFinal: 149000, stock: 35 },
      { sku: 'TS-BLUE-L', name: 'Blue / L', priceOriginal: 199000, priceFinal: 149000, stock: 30 },
    ],
    [
      { key: 'Brand', value: 'Basic Co.' },
      { key: 'Material', value: 'Cotton' },
      { key: 'Color', value: 'Red,Blue' },
      { key: 'Size', value: 'M,L' },
    ],
    [
      { url: 'https://picsum.photos/seed/tshirt1/800', isPrimary: true, position: 0, alt: 'T-shirt primary' },
      { url: 'https://picsum.photos/seed/tshirt2/800', isHover: true, position: 1, alt: 'T-shirt hover' },
    ]
  );

  // === Product 3: Bikini Set ===
  await seedOneProduct(
    ds,
    {
      title: 'Soluna Bikini Set',
      slug: 'soluna-bikini',
      description: 'Summer 2-piece swimwear',
      status: 'published',
      price: '0',
      priceOriginal: '0',
    },
    [
      { sku: 'BK-PINK-S', name: 'Pink / S', priceOriginal: 520000, priceFinal: 459000, stock: 25 },
      { sku: 'BK-PINK-M', name: 'Pink / M', priceOriginal: 520000, priceFinal: 459000, stock: 20 },
      { sku: 'BK-BLUE-S', name: 'Blue / S', priceOriginal: 520000, priceFinal: 479000, stock: 18 },
    ],
    [
      { key: 'Collection', value: 'Soluna' },
      { key: 'Material', value: 'Nylon+Spandex' },
      { key: 'Color', value: 'Pink,Blue' },
      { key: 'Size', value: 'S,M' },
    ],
    [
      { url: 'https://picsum.photos/seed/bikini1/800', isPrimary: true, position: 0 },
      { url: 'https://picsum.photos/seed/bikini2/800', isHover: true, position: 1 },
    ]
  );

  await ds.destroy();
  console.log('✅ Seed completed successfully!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});