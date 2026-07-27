import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Size } from './entities/size.entity';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { Category } from '../products/entities/category.entity';

@Injectable()
export class SizesService {
  constructor(
    @InjectRepository(Size)
    private readonly sizeRepo: Repository<Size>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  private async resolveCategories(categoryIds: string[] | undefined): Promise<Category[]> {
    if (!categoryIds?.length) return [];

    const categories = await this.categoryRepo.findBy({ id: In(categoryIds) });
    if (categories.length !== categoryIds.length) {
      const foundIds = new Set(categories.map((category) => category.id));
      const missingIds = categoryIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Categories not found: ${missingIds.join(', ')}`);
    }
    return categories;
  }

  async create(dto: CreateSizeDto): Promise<Size> {
    const categories = await this.resolveCategories(dto.categoryIds);
    const entity = this.sizeRepo.create({
      name: dto.name,
      categories,
      unit: dto.unit ?? null,
      packQty: dto.packQty ?? null,
      volumeMl: dto.volumeMl ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
    return await this.sizeRepo.save(entity);
  }

  async findAll(categoryId?: string): Promise<Size[]> {
    const qb = this.sizeRepo.createQueryBuilder('size').leftJoinAndSelect('size.categories', 'categories');
    if (categoryId) {
      qb
        .leftJoin('size.categories', 'filterCategory')
        .andWhere(
          '(filterCategory.id = :categoryId OR NOT EXISTS ' +
            '(SELECT 1 FROM size_categories global_scope WHERE global_scope.size_id = size.id))',
          { categoryId },
        );
    }
    return await qb.distinct(true).orderBy('size.sortOrder', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Size> {
    const size = await this.sizeRepo.findOne({ where: { id }, relations: ['categories'] });
    if (!size) throw new NotFoundException('Size not found');
    return size;
  }

  async update(id: string, dto: UpdateSizeDto): Promise<Size> {
    const size = await this.findOne(id);
    if (dto.categoryIds !== undefined) {
      size.categories = await this.resolveCategories(dto.categoryIds);
    }
    if (dto.name !== undefined) size.name = dto.name;
    if (dto.unit !== undefined) size.unit = dto.unit ?? null;
    if (dto.packQty !== undefined) size.packQty = dto.packQty ?? null;
    if (dto.volumeMl !== undefined) size.volumeMl = dto.volumeMl ?? null;
    if (dto.sortOrder !== undefined) size.sortOrder = dto.sortOrder;
    return await this.sizeRepo.save(size);
  }

  async remove(id: string): Promise<void> {
    const size = await this.findOne(id);
    await this.sizeRepo.remove(size);
  }
}


