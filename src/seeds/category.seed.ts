import { DataSource } from 'typeorm';
import { Category } from '../modules/products/entities/category.entity';

export const categorySeeder = async (dataSource: DataSource) => {
  const categoryRepo = dataSource.getRepository(Category);

  const categories = [
    {
      name: 'Bras',
      slug: 'bras',
      description: 'All styles of women’s bras.',
      display_order: 1,
      is_active: true,
      children: [
        { name: 'Push-Up Bras', slug: 'push-up-bras' },
        { name: 'Wireless Bras', slug: 'wireless-bras' },
        { name: 'Strapless Bras', slug: 'strapless-bras' },
        { name: 'Bralettes', slug: 'bralettes' },
        { name: 'Sports Bras', slug: 'sports-bras' },
      ],
    },
    {
      name: 'Panties',
      slug: 'panties',
      description: 'A full range of panty styles designed for comfort.',
      display_order: 2,
      is_active: true,
      children: [
        { name: 'Thong Panties', slug: 'thong-panties' },
        { name: 'Cheeky Panties', slug: 'cheeky-panties' },
        { name: 'Boyshort Panties', slug: 'boyshort-panties' },
        { name: 'Brazilian Panties', slug: 'brazilian-panties' },
        { name: 'Bikini Panties', slug: 'bikini-panties' },
      ],
    },
    {
      name: 'Bikinis & Swimwear',
      slug: 'bikinis-swimwear',
      description: 'Beachwear and swim collections for all body types.',
      display_order: 3,
      is_active: true,
      children: [
        { name: 'One-Piece Swimsuits', slug: 'one-piece-swimsuits' },
        { name: 'Two-Piece Bikinis', slug: 'two-piece-bikinis' },
        { name: 'Bikini Tops', slug: 'bikini-tops' },
        { name: 'Bikini Bottoms', slug: 'bikini-bottoms' },
        { name: 'Cover-Ups', slug: 'cover-ups' },
      ],
    },
  ];

  for (const cat of categories) {
    // Find or create parent by unique slug
    let parent = await categoryRepo.findOne({ where: { slug: cat.slug } });
    if (!parent) {
      parent = categoryRepo.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        display_order: cat.display_order,
        is_active: cat.is_active,
      });
      await categoryRepo.save(parent);
    } else {
      // Update core fields if changed to keep seed as source of truth
      parent.name = cat.name;
      parent.description = cat.description as any;
      parent.display_order = cat.display_order as any;
      parent.is_active = cat.is_active as any;
      await categoryRepo.save(parent);
    }

    if (cat.children) {
      for (const child of cat.children) {
        let sub = await categoryRepo.findOne({ where: { slug: child.slug } });
        if (!sub) {
          sub = categoryRepo.create({
            name: child.name,
            slug: child.slug,
            parent: parent,
            is_active: true,
          });
        } else {
          sub.name = child.name;
          sub.parent = parent;
          sub.is_active = true;
        }
        await categoryRepo.save(sub);
      }
    }
  }

  console.log('✅ Categories seeded successfully!');
};