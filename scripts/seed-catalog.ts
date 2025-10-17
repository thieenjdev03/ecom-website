import 'dotenv/config';
import { DataSource } from 'typeorm';
import ormConfig from '../src/database/typeorm.config';
import { Category } from '../src/modules/products/entities/category.entity';
import { Color } from '../src/modules/colors/entities/color.entity';
import { Size } from '../src/modules/sizes/entities/size.entity';
import { Product } from '../src/modules/products/entities/product.entity';

async function run() {
  const ds = new DataSource((ormConfig as any).options);
  await ds.initialize();
  try {
    const categoryRepo = ds.getRepository(Category);
    const colorRepo = ds.getRepository(Color);
    const sizeRepo = ds.getRepository(Size);
    const productRepo = ds.getRepository(Product);

    // Seed categories (parent/child)
    const apparel = await categoryRepo.save(
      categoryRepo.create({ name: 'Apparel', slug: 'apparel' }),
    );
    const tshirts = await categoryRepo.save(
      categoryRepo.create({ name: 'T-Shirts', slug: 't-shirts', parent: apparel }),
    );

    // Seed colors
    const red = await colorRepo.save(colorRepo.create({ name: 'Red', hexCode: '#FF0000' }));
    const blue = await colorRepo.save(colorRepo.create({ name: 'Blue', hexCode: '#0000FF' }));

    // Seed sizes
    const sizeM = await sizeRepo.save(sizeRepo.create({ name: 'M', category: tshirts, sortOrder: 1 }));
    const sizeL = await sizeRepo.save(sizeRepo.create({ name: 'L', category: tshirts, sortOrder: 2 }));

    // Seed product
    const product = await productRepo.save(
      productRepo.create({
        productCode: 'TSHIRT-BASIC',
        productSku: 'SKU-TS-BASE',
        category: tshirts,
        quantity: 100,
        tags: ['basic', 'cotton'],
        gender: ['Men', 'Women'],
        newLabel: 'New',
        isSale: false,
        isNew: true,
        productPrice: 199000,
        colors: [red, blue],
        sizes: [sizeM, sizeL],
      }),
    );

    // Seed variants
    const variantsData: Array<Partial<ProductVariant>> = [
      { product, color: red, size: sizeM, sku: 'TS-RED-M', price: 199000, quantity: 20 },
      { product, color: red, size: sizeL, sku: 'TS-RED-L', price: 199000, quantity: 20 },
      { product, color: blue, size: sizeM, sku: 'TS-BLU-M', price: 199000, quantity: 20 },
      { product, color: blue, size: sizeL, sku: 'TS-BLU-L', price: 199000, quantity: 20 },
    ];
    for (const v of variantsData) {
      await variantRepo.save(variantRepo.create(v));
    }

    // eslint-disable-next-line no-console
    console.log('✅ Seeded catalog: categories, colors, sizes, product + variants');
  } finally {
    await ds.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


