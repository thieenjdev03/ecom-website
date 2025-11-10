import { DataSource } from 'typeorm';
import { Category } from '../src/modules/products/entities/category.entity';
import { v4 as uuidv4 } from 'uuid';

export async function seedCategories(dataSource: DataSource) {
  const categoryRepo = dataSource.getRepository(Category);

  const categories = [
    {
      id: uuidv4(),
      name: 'Women',
      slug: 'women',
      parent_id: null,
    },
    {
      id: uuidv4(),
      name: 'Men',
      slug: 'men',
      parent_id: null,
    },
    {
      id: uuidv4(),
      name: 'Sports Bras',
      slug: 'sports-bras',
      parent_id: null,
    },
    {
      id: uuidv4(),
      name: 'Bikini Bottoms',
      slug: 'bikini-bottoms',
      parent_id: null,
    },
    {
      id: uuidv4(),
      name: 'Accessories',
      slug: 'accessories',
      parent_id: null,
    },
  ];

  await categoryRepo.save(categories);
  console.log('✅ Seeded categories:', categories.map(c => c.name));
  return categories;
}