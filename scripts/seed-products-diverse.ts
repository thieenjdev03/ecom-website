import 'dotenv/config';
import { DataSource } from 'typeorm';
import ormConfig from '../src/database/typeorm.config';
import { Product } from '../src/modules/products/product.entity';
import { GlobalOption } from '../src/modules/products/entity/option.entity';
import { GlobalOptionValue } from '../src/modules/products/entity/option-value.entity';
import { ProductVariant } from '../src/modules/products/entity/product-variant.entity';
import { ProductMedia } from '../src/modules/products/entity/product-media.entity';
import { ProductAttribute } from '../src/modules/products/entity/product-attribute.entity';

async function run() {
  const ds = new DataSource((ormConfig as any).options);
  await ds.initialize();

  const productRepo = ds.getRepository(Product);
  const globalOptionRepo = ds.getRepository(GlobalOption);
  const globalOptionValueRepo = ds.getRepository(GlobalOptionValue);
  const variantRepo = ds.getRepository(ProductVariant);
  const mediaRepo = ds.getRepository(ProductMedia);
  const attributeRepo = ds.getRepository(ProductAttribute);

  // Clear existing data to avoid conflicts
  console.log('Clearing existing product data...');
  await mediaRepo.delete({});
  await variantRepo.delete({});
  await attributeRepo.delete({});
  await productRepo.delete({});
  await globalOptionValueRepo.delete({});
  await globalOptionRepo.delete({});

  // Create global options
  const colorOpt = await globalOptionRepo.save(globalOptionRepo.create({ name: 'Color', code: 'COLOR' }));
  const sizeOpt = await globalOptionRepo.save(globalOptionRepo.create({ name: 'Size', code: 'SIZE' }));
  const materialOpt = await globalOptionRepo.save(globalOptionRepo.create({ name: 'Material', code: 'MATERIAL' }));

  // Create global option values
  const colors = await globalOptionValueRepo.save([
    globalOptionValueRepo.create({ optionId: colorOpt.id, value: 'Black', sort: 0 }),
    globalOptionValueRepo.create({ optionId: colorOpt.id, value: 'White', sort: 1 }),
    globalOptionValueRepo.create({ optionId: colorOpt.id, value: 'Navy', sort: 2 }),
    globalOptionValueRepo.create({ optionId: colorOpt.id, value: 'Gray', sort: 3 }),
  ]);

  const sizes = await globalOptionValueRepo.save([
    globalOptionValueRepo.create({ optionId: sizeOpt.id, value: 'S', sort: 0 }),
    globalOptionValueRepo.create({ optionId: sizeOpt.id, value: 'M', sort: 1 }),
    globalOptionValueRepo.create({ optionId: sizeOpt.id, value: 'L', sort: 2 }),
    globalOptionValueRepo.create({ optionId: sizeOpt.id, value: 'XL', sort: 3 }),
  ]);

  const materials = await globalOptionValueRepo.save([
    globalOptionValueRepo.create({ optionId: materialOpt.id, value: 'Cotton', sort: 0 }),
    globalOptionValueRepo.create({ optionId: materialOpt.id, value: 'Polyester', sort: 1 }),
    globalOptionValueRepo.create({ optionId: materialOpt.id, value: 'Wool', sort: 2 }),
  ]);

  // Product 1: Premium Hoodie
  const hoodie = await productRepo.save(
    productRepo.create({
      title: 'Premium Hoodie',
      slug: 'premium-hoodie',
      description: 'Comfortable and stylish hoodie with premium materials',
      status: 'published',
    }),
  );

  const hoodieVariants = await variantRepo.save([
    variantRepo.create({
      productId: hoodie.id,
      sku: 'HOODIE-BLACK-M-COTTON',
      name: 'Black / M / Cotton',
      priceOriginal: '450000',
      priceFinal: '350000',
      currency: 'VND',
      stockOnHand: 20,
      stockReserved: 0,
    }),
    variantRepo.create({
      productId: hoodie.id,
      sku: 'HOODIE-WHITE-L-COTTON',
      name: 'White / L / Cotton',
      priceOriginal: '450000',
      priceFinal: '350000',
      currency: 'VND',
      stockOnHand: 15,
      stockReserved: 0,
    }),
    variantRepo.create({
      productId: hoodie.id,
      sku: 'HOODIE-NAVY-XL-WOOL',
      name: 'Navy / XL / Wool',
      priceOriginal: '550000',
      priceFinal: '450000',
      currency: 'VND',
      stockOnHand: 8,
      stockReserved: 0,
    }),
  ]);

  // Hoodie media
  await mediaRepo.save([
    mediaRepo.create({ productId: hoodie.id, url: 'https://picsum.photos/seed/hoodie1/600', position: 0, isPrimary: true }),
    mediaRepo.create({ productId: hoodie.id, url: 'https://picsum.photos/seed/hoodie1h/600', position: 1, isHover: true }),
    mediaRepo.create({ productId: hoodie.id, url: 'https://picsum.photos/seed/hoodie1b/600', position: 2 }),
  ]);

  // Hoodie attributes
  await attributeRepo.save([
    attributeRepo.create({ productId: hoodie.id, key: 'Brand', value: 'Premium Co.' }),
    attributeRepo.create({ productId: hoodie.id, key: 'Care Instructions', value: 'Machine wash cold, tumble dry low' }),
    attributeRepo.create({ productId: hoodie.id, key: 'Origin', value: 'Vietnam' }),
    attributeRepo.create({ productId: hoodie.id, key: 'Weight', value: '500g' }),
  ]);

  // Product 2: Classic Jeans
  const jeans = await productRepo.save(
    productRepo.create({
      title: 'Classic Denim Jeans',
      slug: 'classic-denim-jeans',
      description: 'Timeless denim jeans with perfect fit',
      status: 'published',
    }),
  );

  const jeansVariants = await variantRepo.save([
    variantRepo.create({
      productId: jeans.id,
      sku: 'JEANS-BLACK-S',
      name: 'Black / S',
      priceOriginal: '320000',
      priceFinal: '280000',
      currency: 'VND',
      stockOnHand: 25,
      stockReserved: 0,
    }),
    variantRepo.create({
      productId: jeans.id,
      sku: 'JEANS-NAVY-M',
      name: 'Navy / M',
      priceOriginal: '320000',
      priceFinal: '280000',
      currency: 'VND',
      stockOnHand: 30,
      stockReserved: 0,
    }),
    variantRepo.create({
      productId: jeans.id,
      sku: 'JEANS-GRAY-L',
      name: 'Gray / L',
      priceOriginal: '320000',
      priceFinal: '280000',
      currency: 'VND',
      stockOnHand: 18,
      stockReserved: 0,
    }),
    variantRepo.create({
      productId: jeans.id,
      sku: 'JEANS-BLACK-XL',
      name: 'Black / XL',
      priceOriginal: '320000',
      priceFinal: '280000',
      currency: 'VND',
      stockOnHand: 12,
      stockReserved: 0,
    }),
  ]);

  // Jeans media
  await mediaRepo.save([
    mediaRepo.create({ productId: jeans.id, url: 'https://picsum.photos/seed/jeans1/600', position: 0, isPrimary: true }),
    mediaRepo.create({ productId: jeans.id, url: 'https://picsum.photos/seed/jeans1h/600', position: 1, isHover: true }),
  ]);

  // Jeans attributes
  await attributeRepo.save([
    attributeRepo.create({ productId: jeans.id, key: 'Brand', value: 'Denim Co.' }),
    attributeRepo.create({ productId: jeans.id, key: 'Fit', value: 'Slim' }),
    attributeRepo.create({ productId: jeans.id, key: 'Rise', value: 'Mid-rise' }),
    attributeRepo.create({ productId: jeans.id, key: 'Stretch', value: '2%' }),
  ]);

  // Product 3: Running Shoes
  const shoes = await productRepo.save(
    productRepo.create({
      title: 'Running Shoes Pro',
      slug: 'running-shoes-pro',
      description: 'High-performance running shoes for athletes',
      status: 'published',
    }),
  );

  const shoesVariants = await variantRepo.create([
    {
      productId: shoes.id,
      sku: 'SHOES-WHITE-S',
      name: 'White / S',
      priceOriginal: '1200000',
      priceFinal: '999000',
      currency: 'VND',
      stockOnHand: 10,
      stockReserved: 0,
    },
    {
      productId: shoes.id,
      sku: 'SHOES-BLACK-M',
      name: 'Black / M',
      priceOriginal: '1200000',
      priceFinal: '999000',
      currency: 'VND',
      stockOnHand: 15,
      stockReserved: 0,
    },
    {
      productId: shoes.id,
      sku: 'SHOES-NAVY-L',
      name: 'Navy / L',
      priceOriginal: '1200000',
      priceFinal: '999000',
      currency: 'VND',
      stockOnHand: 8,
      stockReserved: 0,
    },
  ]);

  await variantRepo.save(shoesVariants);

  // Shoes media
  await mediaRepo.save([
    mediaRepo.create({ productId: shoes.id, url: 'https://picsum.photos/seed/shoes1/600', position: 0, isPrimary: true }),
    mediaRepo.create({ productId: shoes.id, url: 'https://picsum.photos/seed/shoes1h/600', position: 1, isHover: true }),
    mediaRepo.create({ productId: shoes.id, url: 'https://picsum.photos/seed/shoes1b/600', position: 2 }),
    mediaRepo.create({ productId: shoes.id, url: 'https://picsum.photos/seed/shoes1c/600', position: 3 }),
  ]);

  // Shoes attributes
  await attributeRepo.save([
    attributeRepo.create({ productId: shoes.id, key: 'Brand', value: 'SportMax' }),
    attributeRepo.create({ productId: shoes.id, key: 'Type', value: 'Running' }),
    attributeRepo.create({ productId: shoes.id, key: 'Cushioning', value: 'High' }),
    attributeRepo.create({ productId: shoes.id, key: 'Waterproof', value: 'Yes' }),
    attributeRepo.create({ productId: shoes.id, key: 'Weight', value: '280g' }),
  ]);

  // Product 4: Smart Watch (no variants)
  const watch = await productRepo.save(
    productRepo.create({
      title: 'Smart Watch Series 5',
      slug: 'smart-watch-series-5',
      description: 'Advanced smartwatch with health monitoring features',
      status: 'published',
    }),
  );

  const watchVariant = await variantRepo.save(
    variantRepo.create({
      productId: watch.id,
      sku: 'WATCH-BLACK-ONE',
      name: 'Black',
      priceOriginal: '2500000',
      priceFinal: '1999000',
      currency: 'VND',
      stockOnHand: 5,
      stockReserved: 0,
    }),
  );

  // Watch media
  await mediaRepo.save([
    mediaRepo.create({ productId: watch.id, url: 'https://picsum.photos/seed/watch1/600', position: 0, isPrimary: true }),
    mediaRepo.create({ productId: watch.id, url: 'https://picsum.photos/seed/watch1h/600', position: 1, isHover: true }),
  ]);

  // Watch attributes
  await attributeRepo.save([
    attributeRepo.create({ productId: watch.id, key: 'Brand', value: 'TechWatch' }),
    attributeRepo.create({ productId: watch.id, key: 'Display', value: '1.9" AMOLED' }),
    attributeRepo.create({ productId: watch.id, key: 'Battery Life', value: '7 days' }),
    attributeRepo.create({ productId: watch.id, key: 'Water Resistance', value: '5ATM' }),
    attributeRepo.create({ productId: watch.id, key: 'Connectivity', value: 'Bluetooth 5.0, WiFi' }),
  ]);

  console.log('Seeded diverse products:');
  console.log('- Premium Hoodie (3 variants)');
  console.log('- Classic Denim Jeans (4 variants)');
  console.log('- Running Shoes Pro (3 variants)');
  console.log('- Smart Watch Series 5 (1 variant)');
  console.log('Total products:', 4);
  console.log('Total variants:', hoodieVariants.length + jeansVariants.length + shoesVariants.length + 1);

  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
