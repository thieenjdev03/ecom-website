import { DataSource } from 'typeorm';
import { Product } from '../modules/products/entities/product.entity';
import { Category } from '../modules/products/entities/category.entity';

// === CONFIG RANDOM ===
const COLORS = [
  { id: '3be1da83-7bbf-4db1-97c3-58e509e8f88b', name: { en: 'Orange', vi: 'Cam' } },
  { id: 'f7722817-d43b-45fb-96a3-de652555522e', name: { en: 'Red', vi: 'Đỏ' } },
  { id: 'c32144ea-f3df-47f2-ab85-087981d43840', name: { en: 'Blue', vi: 'Xanh' } },
];

const SIZES = [
  { id: 'e22ef54b-ffe8-4938-94ce-d8e8ddd6f29b', name: 'S' },
  { id: '85662452-235a-491c-97d2-68af225c2f82', name: 'M' },
  { id: '0abd65f1-4373-43ea-9a3f-5a913ec92833', name: 'L' },
  { id: '8523ccf1-2cb7-4586-b510-aff65509e774', name: 'XL' },
];

// Random ảnh style fashion
const RANDOM_IMAGES = [
  'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg',
  'https://images.pexels.com/photos/2983465/pexels-photo-2983465.jpeg',
  'https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg',
  'https://images.pexels.com/photos/6311672/pexels-photo-6311672.jpeg',
  "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg",
  "https://images.pexels.com/photos/6311672/pexels-photo-6311672.jpeg",
  "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg",
  "https://images.pexels.com/photos/2983465/pexels-photo-2983465.jpeg",
  "https://images.pexels.com/photos/2983462/pexels-photo-2983462.jpeg",
  "https://images.pexels.com/photos/6311670/pexels-photo-6311670.jpeg",
  "https://images.pexels.com/photos/6311683/pexels-photo-6311683.jpeg",
  "https://images.pexels.com/photos/6311665/pexels-photo-6311665.jpeg",
  "https://images.pexels.com/photos/6311656/pexels-photo-6311656.jpeg",
  "https://images.pexels.com/photos/2983463/pexels-photo-2983463.jpeg",
];

// Random tên sản phẩm
const PRODUCT_NAMES = [
  { en: 'Premium Soft Bra', vi: 'Áo Ngực Cao Cấp' },
  { en: 'Classic Cotton Tee', vi: 'Áo Thun Cotton Cổ Điển' },
  { en: 'Comfort Wireless Bra', vi: 'Áo Ngực Không Gọng' },
  { en: 'Training Sports Bra', vi: 'Áo Ngực Thể Thao' },
  { en: 'Striped Cotton Shirt', vi: 'Áo Thun Kẻ Sọc' },
];

// Generate slug
function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đ]/g, 'd')
    .replace(/\s+/g, '-');
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomImages() {
  return [
    pick(RANDOM_IMAGES),
    pick(RANDOM_IMAGES),
  ];
}

export async function productSeeder(dataSource: DataSource, total = 10) {
  const productRepo = dataSource.getRepository(Product);
  const categoryRepo = dataSource.getRepository(Category);

  const categories = await categoryRepo.find();
  if (!categories.length) throw new Error('Categories empty!');

  const savedProducts: Product[] = [];

  for (let i = 0; i < total; i++) {
    const productName = pick(PRODUCT_NAMES);
    const category = pick(categories);

    const slugEn = toSlug(productName.en + '-' + i);
    const slugVi = toSlug(productName.vi + '-' + i);

    // Build variants
    const variants = SIZES.map((size) => {
      const color = pick(COLORS);
      return {
        name: {
          en: `${size.name} - ${color.name.en}`,
          vi: `${size.name} - ${color.name.vi}`,
        },
        sku: `${slugEn.toUpperCase().replace(/-/g, '')}-${size.name}-${color.name.en.toUpperCase()}`,
        price: 299000 + Math.floor(Math.random() * 100000),
        stock: 10 + Math.floor(Math.random() * 20),
        color_id: color.id,
        size_id: size.id,
      };
    });

    const productData = {
      name: productName,
      slug: { en: slugEn, vi: slugVi },
      description: {
        en: `${productName.en} with premium material and modern fit.`,
        vi: `${productName.vi} với chất liệu cao cấp và form hiện đại.`,
      },
      short_description: {
        en: `${productName.en} – soft, comfy and stylish.`,
        vi: `${productName.vi} – mềm mại, thoải mái và thời trang.`,
      },
      price: 299000,
      sale_price: 249000,
      cost_price: 150000,
      images: randomImages(),
      variants,
      stock_quantity: 0,
      sku: null,
      barcode: null,
      category_id: category.id,
      tags: ['women', 'clothing', 'fashion'],
      status: 'active',
      is_featured: Math.random() > 0.5,
      enable_sale_tag: true,
      meta_title: {
        en: `${productName.en} - Premium Quality`,
        vi: `${productName.vi} - Chất Lượng Cao`,
      },
      meta_description: {
        en: `Premium ${productName.en} with elegant design.`,
        vi: `${productName.vi} cao cấp với thiết kế tinh tế.`,
      },
      weight: 150 + Math.floor(Math.random() * 100),
      dimensions: { length: 20, width: 15, height: 3 },
    };

    const existing = await productRepo
      .createQueryBuilder('product')
      .where(`product.slug->>'en' = :slugEn`, { slugEn })
      .getOne();

    if (!existing) {
      const product = productRepo.create(productData as any);
      const saved = (await productRepo.save(product)) as unknown as Product;
      savedProducts.push(saved);
      const productNameDisplay = typeof saved.name === 'object' ? saved.name.en : saved.name;
      console.log(`✅ Created: ${productNameDisplay} (${saved.id})`);
    } else {
      console.log(`⚠️ Skipped existed: ${productName.en}`);
    }
  }

  console.log(`\n🎉 Done! Seeded ${savedProducts.length}/${total} products.`);
  return savedProducts;
}