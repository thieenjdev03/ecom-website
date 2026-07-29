import 'dotenv/config';
import { DataSource } from 'typeorm';
import ormConfig from '../src/database/typeorm.config';
import { Collection } from '../src/modules/collections/entities/collection.entity';
import { ProductCollection } from '../src/modules/collections/entities/product-collection.entity';
import { Distributor } from '../src/modules/distributors/entities/distributor.entity';
import { Product } from '../src/modules/products/entities/product.entity';

async function upsertCollection(
  dataSource: DataSource,
  values: Partial<Collection> & Pick<Collection, 'name' | 'slug'>,
) {
  const repository = dataSource.getRepository(Collection);
  const existing = await repository.findOne({ where: { slug: values.slug } });
  return repository.save(
    repository.create(existing ? { ...existing, ...values } : values),
  );
}

async function run() {
  const dataSource = new DataSource((ormConfig as any).options);
  await dataSource.initialize();

  try {
    const hero = await upsertCollection(dataSource, {
      name: 'Mingo Crème Caramel',
      slug: 'mingo-creme-caramel',
      description: 'Bộ sưu tập nổi bật trên trang chủ Mingo.',
      banner_image_url:
        process.env.MINGO_HERO_BANNER_URL ??
        '/images/mingo/hero-creme-caramel.webp',
      mobile_banner_image_url:
        process.env.MINGO_HERO_MOBILE_BANNER_URL ?? null,
      cta_label: 'Xem sản phẩm',
      placement: 'HERO',
      sort_order: 10,
      is_active: true,
    });
    const mustTry = await upsertCollection(dataSource, {
      name: 'Phải thử',
      slug: 'phai-thu',
      description: 'Những sản phẩm Mingo được yêu thích.',
      cta_label: 'Khám phá',
      placement: 'HOME_SECTION',
      sort_order: 20,
      is_active: true,
    });

    const distributorRepository = dataSource.getRepository(Distributor);
    const homeProvinceCode =
      process.env.MINGO_HOME_PROVINCE_CODE?.trim() || '79';
    const distributorSlug = 'mingo-hcm';
    const existingDistributor = await distributorRepository.findOne({
      where: { slug: distributorSlug },
    });
    await distributorRepository.save(
      distributorRepository.create({
        ...existingDistributor,
        name: 'Đại lý Mingo Hồ Chí Minh',
        slug: distributorSlug,
        address_line: 'Cập nhật địa chỉ đại lý trong trang quản trị',
        district_text: 'Cập nhật quận/huyện',
        ward_code: '00000',
        ward_name: 'Cập nhật phường/xã',
        province_code: homeProvinceCode,
        province_name: 'Hồ Chí Minh',
        description: 'Dữ liệu mẫu an toàn; có thể cập nhật trong admin.',
        maps_embed_src: 'https://www.google.com/maps',
        is_active: true,
      }),
    );

    const products = await dataSource.getRepository(Product).find({
      where: { status: 'active' },
      order: { created_at: 'DESC' },
      take: 8,
    });
    const assignmentRepository =
      dataSource.getRepository(ProductCollection);
    for (const collection of [hero, mustTry]) {
      for (const product of products) {
        const exists = await assignmentRepository.findOne({
          where: {
            collection_id: collection.id,
            product_id: product.id,
          },
        });
        if (!exists) {
          await assignmentRepository.save(
            assignmentRepository.create({
              collection_id: collection.id,
              product_id: product.id,
            }),
          );
        }
      }
    }

    console.log(
      `Seeded Mingo safely: 2 collections, 1 distributor, ${products.length} product assignments per collection.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
