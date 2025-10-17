import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Category } from '../src/modules/products/entities/category.entity';
import { Product } from '../src/modules/products/entities/product.entity';

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Category, Product],
    synchronize: false,
    logging: false,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });
  await ds.initialize();
  
  try {
    const categoryRepo = ds.getRepository(Category);
    const productRepo = ds.getRepository(Product);

    console.log('🌱 Starting to seed products and categories...');

    // Create categories
    const categories = await categoryRepo.save([
      {
        name: 'T-Shirts',
        slug: 't-shirts',
        description: 'All types of t-shirts',
        display_order: 1,
        is_active: true,
      },
      {
        name: 'Polo Shirts',
        slug: 'polo-shirts',
        description: 'Premium polo shirts',
        display_order: 2,
        is_active: true,
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Fashion accessories',
        display_order: 3,
        is_active: true,
      },
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create products without variants
    const simpleProducts = await productRepo.save([
      {
        name: 'Basic White T-Shirt',
        slug: 'basic-white-tshirt',
        description: '100% cotton, comfortable fit',
        short_description: 'Classic white tee',
        price: 299000,
        sale_price: 249000,
        images: ['https://via.placeholder.com/500x500?text=White+Tee'],
        stock_quantity: 50,
        sku: 'TEE-WHITE-001',
        category_id: categories[0].id,
        tags: ['t-shirt', 'basic', 'unisex'],
        status: 'active',
        is_featured: false,
      },
      {
        name: 'Black Basic T-Shirt',
        slug: 'black-basic-tshirt',
        description: '100% cotton, comfortable fit',
        short_description: 'Classic black tee',
        price: 299000,
        stock_quantity: 45,
        sku: 'TEE-BLACK-001',
        category_id: categories[0].id,
        tags: ['t-shirt', 'basic', 'unisex'],
        status: 'active',
        is_featured: false,
      },
    ]);

    console.log(`✅ Created ${simpleProducts.length} simple products`);

    // Create product with variants
    const productWithVariants = await productRepo.save({
      name: 'Premium Polo Shirt',
      slug: 'premium-polo-shirt',
      description: 'High quality cotton pique polo shirt with multiple color and size options',
      short_description: 'Premium cotton polo',
      price: 399000,
      images: [
        'https://via.placeholder.com/500x500?text=Polo+Black',
        'https://via.placeholder.com/500x500?text=Polo+White',
      ],
      variants: [
        { name: 'M - Black', sku: 'POLO-M-BLACK', price: 399000, stock: 10 },
        { name: 'M - White', sku: 'POLO-M-WHITE', price: 399000, stock: 8 },
        { name: 'L - Black', sku: 'POLO-L-BLACK', price: 419000, stock: 12 },
        { name: 'L - White', sku: 'POLO-L-WHITE', price: 419000, stock: 5 },
        { name: 'XL - Black', sku: 'POLO-XL-BLACK', price: 439000, stock: 6 },
        { name: 'XL - White', sku: 'POLO-XL-WHITE', price: 439000, stock: 4 },
      ],
      category_id: categories[1].id,
      tags: ['polo', 'men', 'premium'],
      status: 'active',
      is_featured: true,
    });

    console.log(`✅ Created 1 product with variants`);

    // Create more sample products
    const moreProducts = await productRepo.save([
      {
        name: 'Classic Denim Jacket',
        slug: 'classic-denim-jacket',
        description: 'Timeless denim jacket perfect for any season',
        short_description: 'Classic denim style',
        price: 599000,
        sale_price: 499000,
        images: ['https://via.placeholder.com/500x500?text=Denim+Jacket'],
        stock_quantity: 25,
        sku: 'JACKET-DENIM-001',
        category_id: categories[0].id,
        tags: ['jacket', 'denim', 'classic'],
        status: 'active',
        is_featured: true,
      },
      {
        name: 'Leather Wallet',
        slug: 'leather-wallet',
        description: 'Premium leather wallet with multiple card slots',
        short_description: 'Premium leather wallet',
        price: 199000,
        images: ['https://via.placeholder.com/500x500?text=Leather+Wallet'],
        stock_quantity: 30,
        sku: 'WALLET-LEATHER-001',
        category_id: categories[2].id,
        tags: ['wallet', 'leather', 'accessories'],
        status: 'active',
        is_featured: false,
      },
    ]);

    console.log(`✅ Created ${moreProducts.length} additional products`);

    console.log('🎉 Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Simple products: ${simpleProducts.length}`);
    console.log(`   - Products with variants: 1`);
    console.log(`   - Additional products: ${moreProducts.length}`);
    console.log(`   - Total products: ${simpleProducts.length + 1 + moreProducts.length}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await ds.destroy();
  }
}

run().catch(console.error);
