/* eslint-disable no-console */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import ormConfig from '../src/database/typeorm.config';
import { Category } from '../src/modules/categories/category.entity';

type CategorySpec = {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status?: string;
};

async function run() {
  const ds = new DataSource((ormConfig as any).options);
  await ds.initialize();

  const categoryRepo = ds.getRepository(Category);

  // Clear existing data
  console.log('Clearing existing categories...');
  await ds.query('DELETE FROM categories');

  console.log('Seeding categories...');

  // Main Categories
  const fashion = await categoryRepo.save(
    categoryRepo.create({
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing and fashion accessories',
      image: 'https://picsum.photos/seed/fashion/400',
      status: 'ACTIVE',
    }),
  );

  const electronics = await categoryRepo.save(
    categoryRepo.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      image: 'https://picsum.photos/seed/electronics/400',
      status: 'ACTIVE',
    }),
  );

  const sports = await categoryRepo.save(
    categoryRepo.create({
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Sports equipment and outdoor gear',
      image: 'https://picsum.photos/seed/sports/400',
      status: 'ACTIVE',
    }),
  );

  const home = await categoryRepo.save(
    categoryRepo.create({
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Home decor and living essentials',
      image: 'https://picsum.photos/seed/home/400',
      status: 'ACTIVE',
    }),
  );

  const beauty = await categoryRepo.save(
    categoryRepo.create({
      name: 'Beauty & Health',
      slug: 'beauty-health',
      description: 'Beauty products and health care',
      image: 'https://picsum.photos/seed/beauty/400',
      status: 'ACTIVE',
    }),
  );

  // Fashion Subcategories
  const menFashion = await categoryRepo.save(
    categoryRepo.create({
      name: "Men's Fashion",
      slug: 'mens-fashion',
      description: 'Fashion for men',
      image: 'https://picsum.photos/seed/mens/400',
      status: 'ACTIVE',
    }),
  );

  const womenFashion = await categoryRepo.save(
    categoryRepo.create({
      name: "Women's Fashion",
      slug: 'womens-fashion',
      description: 'Fashion for women',
      image: 'https://picsum.photos/seed/womens/400',
      status: 'ACTIVE',
    }),
  );

  const kidsFashion = await categoryRepo.save(
    categoryRepo.create({
      name: "Kids' Fashion",
      slug: 'kids-fashion',
      description: 'Fashion for children',
      image: 'https://picsum.photos/seed/kids/400',
      status: 'ACTIVE',
    }),
  );

  // Men's Fashion Subcategories
  await categoryRepo.save([
    categoryRepo.create({
      name: 'T-Shirts',
      slug: 'mens-tshirts',
      description: "Men's t-shirts",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Shirts',
      slug: 'mens-shirts',
      description: "Men's formal and casual shirts",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Jeans & Pants',
      slug: 'mens-jeans-pants',
      description: "Men's jeans and pants",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Hoodies & Sweatshirts',
      slug: 'mens-hoodies',
      description: "Men's hoodies and sweatshirts",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Shoes',
      slug: 'mens-shoes',
      description: "Men's footwear",
      status: 'ACTIVE',
    }),
  ]);

  // Women's Fashion Subcategories
  await categoryRepo.save([
    categoryRepo.create({
      name: 'Dresses',
      slug: 'womens-dresses',
      description: "Women's dresses",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Tops & Blouses',
      slug: 'womens-tops',
      description: "Women's tops and blouses",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Jeans & Pants',
      slug: 'womens-jeans-pants',
      description: "Women's jeans and pants",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Swimwear',
      slug: 'womens-swimwear',
      description: "Women's swimwear and bikinis",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Shoes & Heels',
      slug: 'womens-shoes',
      description: "Women's footwear",
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Bags & Accessories',
      slug: 'womens-bags',
      description: "Women's bags and accessories",
      status: 'ACTIVE',
    }),
  ]);

  // Electronics Subcategories
  await categoryRepo.save([
    categoryRepo.create({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and accessories',
      image: 'https://picsum.photos/seed/phones/400',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Laptops & Computers',
      slug: 'laptops-computers',
      description: 'Laptops, desktops, and accessories',
      image: 'https://picsum.photos/seed/laptops/400',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Smartwatches',
      slug: 'smartwatches',
      description: 'Smart watches and fitness trackers',
      image: 'https://picsum.photos/seed/watches/400',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Headphones & Audio',
      slug: 'headphones-audio',
      description: 'Headphones, earbuds, and speakers',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Cameras',
      slug: 'cameras',
      description: 'Digital cameras and accessories',
      status: 'ACTIVE',
    }),
  ]);

  // Sports Subcategories
  await categoryRepo.save([
    categoryRepo.create({
      name: 'Running & Jogging',
      slug: 'running-jogging',
      description: 'Running shoes and gear',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Gym & Fitness',
      slug: 'gym-fitness',
      description: 'Gym equipment and fitness gear',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Yoga & Pilates',
      slug: 'yoga-pilates',
      description: 'Yoga mats and pilates equipment',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Outdoor Activities',
      slug: 'outdoor-activities',
      description: 'Camping, hiking, and outdoor gear',
      status: 'ACTIVE',
    }),
  ]);

  // Home & Living Subcategories
  await categoryRepo.save([
    categoryRepo.create({
      name: 'Furniture',
      slug: 'furniture',
      description: 'Home furniture',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Kitchen & Dining',
      slug: 'kitchen-dining',
      description: 'Kitchen appliances and dining ware',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Bedding & Bath',
      slug: 'bedding-bath',
      description: 'Bedding sets and bathroom accessories',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Home Decor',
      slug: 'home-decor',
      description: 'Decorative items for home',
      status: 'ACTIVE',
    }),
  ]);

  // Beauty & Health Subcategories
  await categoryRepo.save([
    categoryRepo.create({
      name: 'Skincare',
      slug: 'skincare',
      description: 'Skincare products',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Makeup',
      slug: 'makeup',
      description: 'Makeup and cosmetics',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Haircare',
      slug: 'haircare',
      description: 'Hair care products',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Fragrances',
      slug: 'fragrances',
      description: 'Perfumes and colognes',
      status: 'ACTIVE',
    }),
    categoryRepo.create({
      name: 'Health Supplements',
      slug: 'health-supplements',
      description: 'Vitamins and supplements',
      status: 'ACTIVE',
    }),
  ]);

  const totalCategories = await categoryRepo.count();
  
  await ds.destroy();
  
  console.log(`✅ Seed completed successfully!`);
  console.log(`📦 Total categories created: ${totalCategories}`);
  console.log(`📂 Main categories: 5`);
  console.log(`📁 Subcategories: ${totalCategories - 5}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

