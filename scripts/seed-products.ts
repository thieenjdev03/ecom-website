import 'dotenv/config';
import { DataSource } from 'typeorm';
import ormConfig from '../src/database/typeorm.config';
import { Product } from '../src/modules/products/product.entity';
import { GlobalOption } from '../src/modules/products/entity/option.entity';
import { GlobalOptionValue } from '../src/modules/products/entity/option-value.entity';
import { ProductVariant } from '../src/modules/products/entity/product-variant.entity';
import { ProductMedia } from '../src/modules/products/entity/product-media.entity';

async function run() {
  const ds = new DataSource((ormConfig as any).options);
  await ds.initialize();

  const productRepo = ds.getRepository(Product);
  const globalOptionRepo = ds.getRepository(GlobalOption);
  const globalOptionValueRepo = ds.getRepository(GlobalOptionValue);
  const variantRepo = ds.getRepository(ProductVariant);
  const mediaRepo = ds.getRepository(ProductMedia);

  // Clear existing data to avoid conflicts
  console.log('Clearing existing product data...');
  await mediaRepo.delete({});
  await variantRepo.delete({});
  await productRepo.delete({});
  await globalOptionValueRepo.delete({});
  await globalOptionRepo.delete({});

  // Create product
  const product = await productRepo.save(
    productRepo.create({
      title: 'T-Shirt Basic',
      slug: 't-shirt-basic',
      description: 'Basic cotton T-Shirt',
      status: 'published',
    }),
  );

  // Global Options
  const colorOpt = await globalOptionRepo.save(globalOptionRepo.create({ name: 'Color', code: 'COLOR' }));
  const sizeOpt = await globalOptionRepo.save(globalOptionRepo.create({ name: 'Size', code: 'SIZE' }));

  // Global values
  const redG = await globalOptionValueRepo.save(globalOptionValueRepo.create({ optionId: colorOpt.id, value: 'Red', sort: 0 }));
  const blueG = await globalOptionValueRepo.save(globalOptionValueRepo.create({ optionId: colorOpt.id, value: 'Blue', sort: 1 }));
  const mG = await globalOptionValueRepo.save(globalOptionValueRepo.create({ optionId: sizeOpt.id, value: 'M', sort: 0 }));
  const lG = await globalOptionValueRepo.save(globalOptionValueRepo.create({ optionId: sizeOpt.id, value: 'L', sort: 1 }));

  // Variants (simplified - no option value linking)
  const variants = await variantRepo.save([
    variantRepo.create({
      productId: product.id,
      sku: 'TSHIRT-RED-M',
      name: 'Red / M',
      priceOriginal: '199000',
      priceFinal: '159000',
      currency: 'VND',
      stockOnHand: 50,
      stockReserved: 0,
    }),
    variantRepo.create({
      productId: product.id,
      sku: 'TSHIRT-RED-L',
      name: 'Red / L',
      priceOriginal: '199000',
      priceFinal: '159000',
      currency: 'VND',
      stockOnHand: 30,
      stockReserved: 0,
    }),
    variantRepo.create({
      productId: product.id,
      sku: 'TSHIRT-BLUE-M',
      name: 'Blue / M',
      priceOriginal: '199000',
      priceFinal: '159000',
      currency: 'VND',
      stockOnHand: 25,
      stockReserved: 0,
    }),
    variantRepo.create({
      productId: product.id,
      sku: 'TSHIRT-BLUE-L',
      name: 'Blue / L',
      priceOriginal: '199000',
      priceFinal: '159000',
      currency: 'VND',
      stockOnHand: 40,
      stockReserved: 0,
    }),
  ]);

  // Media
  await mediaRepo.save(
    mediaRepo.create({ productId: product.id, url: 'https://picsum.photos/seed/p1/600', position: 0, isPrimary: true }),
  );
  await mediaRepo.save(
    mediaRepo.create({ productId: product.id, url: 'https://picsum.photos/seed/p1h/600', position: 1, isHover: true }),
  );

  console.log('Seeded product with variants and media:', product.id);
  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});