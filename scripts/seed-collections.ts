import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Collection } from '../src/modules/collections/entities/collection.entity';
import { ProductCollection } from '../src/modules/collections/entities/product-collection.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { Category } from '../src/modules/products/entities/category.entity';

// Initialize data source
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Collection, ProductCollection, Product, Category],
  synchronize: false,
  logging: true,
});

// Sample collection data
const collectionsData = [
  {
    name: 'Summer Collection 2024',
    slug: 'summer-collection-2024',
    description: 'Discover our latest summer fashion trends. Light, breezy, and perfect for hot weather. Shop the freshest styles for the season.',
    banner_image_url: 'https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=1200',
    seo_title: 'Summer Collection 2024 - Trendy Summer Fashion | Fashion Store',
    seo_description: 'Browse our curated summer collection featuring the latest trends in lightweight clothing, swimwear, and summer accessories.',
    is_active: true,
  },
  {
    name: 'Winter Essentials',
    slug: 'winter-essentials',
    description: 'Stay warm and stylish this winter. Our winter collection features cozy sweaters, jackets, and cold-weather accessories.',
    banner_image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
    seo_title: 'Winter Essentials - Cozy Winter Fashion | Fashion Store',
    seo_description: 'Shop our winter essentials collection for warm clothing, jackets, and accessories to keep you comfortable all season.',
    is_active: true,
  },
  {
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description: 'Check out what just landed! The latest products fresh from our designers. Be the first to shop the newest styles.',
    banner_image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    seo_title: 'New Arrivals - Latest Fashion Trends | Fashion Store',
    seo_description: 'Discover the newest additions to our collection. Fresh styles and trending fashion pieces just arrived.',
    is_active: true,
  },
  {
    name: 'Best Sellers',
    slug: 'best-sellers',
    description: 'Our most popular products that customers love. These items are flying off the shelves for good reason!',
    banner_image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200',
    seo_title: 'Best Sellers - Top Rated Fashion Products | Fashion Store',
    seo_description: 'Shop our best-selling products. Customer favorites and top-rated items that everyone is talking about.',
    is_active: true,
  },
  {
    name: 'Sale Items',
    slug: 'sale-items',
    description: 'Amazing deals on selected items! Save big on quality fashion. Limited time offers - shop now before they are gone.',
    banner_image_url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200',
    seo_title: 'Sale Items - Fashion on Sale | Fashion Store',
    seo_description: 'Huge discounts on fashion items. Shop our sale collection for amazing deals on quality products.',
    is_active: true,
  },
  {
    name: 'Premium Collection',
    slug: 'premium-collection',
    description: 'Luxury fashion pieces for the discerning customer. High-quality materials and expert craftsmanship in every item.',
    banner_image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
    seo_title: 'Premium Collection - Luxury Fashion | Fashion Store',
    seo_description: 'Explore our premium collection of luxury fashion items. High-end quality and sophisticated designs.',
    is_active: true,
  },
  {
    name: 'Casual Wear',
    slug: 'casual-wear',
    description: 'Comfortable everyday fashion. Perfect for weekend activities, casual outings, or just relaxing at home.',
    banner_image_url: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1200',
    seo_title: 'Casual Wear - Comfortable Everyday Fashion | Fashion Store',
    seo_description: 'Shop our casual wear collection for comfortable, stylish clothing perfect for everyday activities.',
    is_active: true,
  },
  {
    name: 'Office Attire',
    slug: 'office-attire',
    description: 'Professional fashion for the modern workplace. Look sharp and feel confident in our business collection.',
    banner_image_url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1200',
    seo_title: 'Office Attire - Professional Fashion | Fashion Store',
    seo_description: 'Discover professional office attire and business wear. Stylish and appropriate for the workplace.',
    is_active: true,
  },
  {
    name: 'Activewear',
    slug: 'activewear',
    description: 'Performance clothing for your active lifestyle. Breathable, flexible, and designed for movement.',
    banner_image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200',
    seo_title: 'Activewear - Performance Athletic Clothing | Fashion Store',
    seo_description: 'Shop activewear and athletic clothing. High-performance fabrics for your workouts and active lifestyle.',
    is_active: true,
  },
  {
    name: 'Limited Edition',
    slug: 'limited-edition',
    description: 'Exclusive items available in limited quantities. Unique designs you will not find anywhere else.',
    banner_image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea3c814e?w=1200',
    seo_title: 'Limited Edition - Exclusive Fashion Items | Fashion Store',
    seo_description: 'Shop limited edition fashion pieces. Exclusive designs available in limited quantities only.',
    is_active: true,
  },
];

async function seedCollections() {
  console.log('🌱 Starting collections seed...\n');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const collectionRepository = AppDataSource.getRepository(Collection);
    const productRepository = AppDataSource.getRepository(Product);
    const productCollectionRepository = AppDataSource.getRepository(ProductCollection);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing collections...');
    await productCollectionRepository.query('DELETE FROM product_collections');
    await collectionRepository.query('DELETE FROM collections');
    console.log('✅ Cleared existing collections\n');

    // Create collections
    console.log('📦 Creating collections...');
    const createdCollections = [];
    for (const collectionData of collectionsData) {
      const collection = collectionRepository.create(collectionData);
      const saved = await collectionRepository.save(collection);
      createdCollections.push(saved);
      console.log(`   ✓ Created: ${saved.name} (${saved.slug})`);
    }
    console.log(`✅ Created ${createdCollections.length} collections\n`);

    // Get all active products
    console.log('🔍 Fetching products...');
    const products = await productRepository.find({
      where: { status: 'active' },
      take: 50, // Get up to 50 products
    });
    
    if (products.length === 0) {
      console.log('⚠️  No products found. Please run product seeder first.');
      console.log('   Run: npm run seed:products\n');
      await AppDataSource.destroy();
      return;
    }
    console.log(`✅ Found ${products.length} products\n`);

    // Assign products to collections
    console.log('🔗 Assigning products to collections...');
    
    // Helper function to get random products
    const getRandomProducts = (count: number) => {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, products.length));
    };

    // Assign different numbers of products to each collection
    const assignments = [
      { collection: createdCollections[0], productCount: 12 }, // Summer Collection
      { collection: createdCollections[1], productCount: 10 }, // Winter Essentials
      { collection: createdCollections[2], productCount: 15 }, // New Arrivals
      { collection: createdCollections[3], productCount: 20 }, // Best Sellers
      { collection: createdCollections[4], productCount: 8 },  // Sale Items
      { collection: createdCollections[5], productCount: 6 },  // Premium Collection
      { collection: createdCollections[6], productCount: 14 }, // Casual Wear
      { collection: createdCollections[7], productCount: 10 }, // Office Attire
      { collection: createdCollections[8], productCount: 12 }, // Activewear
      { collection: createdCollections[9], productCount: 5 },  // Limited Edition
    ];

    let totalAssignments = 0;
    for (const { collection, productCount } of assignments) {
      const selectedProducts = getRandomProducts(productCount);
      
      for (const product of selectedProducts) {
        const productCollection = productCollectionRepository.create({
          product_id: product.id,
          collection_id: collection.id,
        });
        await productCollectionRepository.save(productCollection);
        totalAssignments++;
      }
      
      console.log(`   ✓ ${collection.name}: ${selectedProducts.length} products`);
    }
    
    console.log(`✅ Created ${totalAssignments} product-collection assignments\n`);

    // Display summary
    console.log('📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const collection of createdCollections) {
      const count = await productCollectionRepository.count({
        where: { collection_id: collection.id },
      });
      console.log(`   ${collection.name.padEnd(25)} - ${count} products`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Collections seed completed successfully!\n');
    console.log('📝 You can now:');
    console.log('   - List collections: GET http://localhost:3000/collections');
    console.log('   - Get collection: GET http://localhost:3000/collections/:id');
    console.log('   - Get products: GET http://localhost:3000/collections/:id/products\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding collections:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// Run the seed function
seedCollections();

