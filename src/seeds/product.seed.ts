import { DataSource } from 'typeorm';
import { Product } from '../modules/products/entities/product.entity';
import { Category } from '../modules/products/entities/category.entity';

// Seed one sample product (with variants) linked to an existing category by slug
export async function productSeeder(dataSource: DataSource) {
  const productRepo = dataSource.getRepository(Product);
  const categoryRepo = dataSource.getRepository(Category);

  // Prefer a concrete category to demo FE navigation (sports-bras)
  const category = await categoryRepo.findOne({ where: { slug: 'sports-bras' } });
  if (!category) {
    throw new Error('Required category with slug "sports-bras" not found. Seed categories first.');
  }

  const sampleProduct = productRepo.create({
    name: 'High Support Sports Bra',
    slug: 'high-support-sports-bra',
    description: 'Breathable, moisture-wicking fabric. Designed for high-intensity workouts.',
    short_description: 'High support. Quick dry.',
    price: 499000,
    sale_price: 449000,
    cost_price: 300000,
    images: ['https://example.com/images/sports-bra-1.jpg'],
    variants: [
      {
        name: 'S - Black',
        sku: 'BRA-S-BLACK',
        price: 499000,
        stock: 15,
        color_id: '1',
        size_id: 'S',
      },
      {
        name: 'M - Black',
        sku: 'BRA-M-BLACK',
        price: 499000,
        stock: 20,
        color_id: '1',
        size_id: 'M',
      },
    ],
    stock_quantity: 0, // using variants
    sku: null,
    barcode: null,
    category_id: category.id,
    tags: ['training', 'sports', 'women'],
    status: 'active',
    is_featured: true,
    enable_sale_tag: true,
    meta_title: 'High Support Sports Bra',
    meta_description: 'Supportive sports bra designed for performance.',
    weight: 250,
    dimensions: { length: 20, width: 15, height: 5 },
  });

  const saved = await productRepo.save(sampleProduct);
  // eslint-disable-next-line no-console
  console.log('✅ Seeded product:', `${saved.name} (${saved.id}) in category ${category.name}`);
  return saved;
}


