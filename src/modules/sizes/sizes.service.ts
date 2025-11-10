import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(dto: CreateSizeDto): Promise<Size> {
    let category: Category | undefined = undefined;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
    }
    const entity = this.sizeRepo.create({ name: dto.name, category, sortOrder: dto.sortOrder ?? 0 });
    return await this.sizeRepo.save(entity);
  }

  async findAll(categoryId?: string): Promise<Size[]> {
    const qb = this.sizeRepo.createQueryBuilder('size').leftJoinAndSelect('size.category', 'category');
    if (categoryId) {
      qb.where('category.id = :categoryId', { categoryId });
    }
    return await qb.orderBy('size.sortOrder', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Size> {
    const size = await this.sizeRepo.findOne({ where: { id }, relations: ['category'] });
    if (!size) throw new NotFoundException('Size not found');
    return size;
  }

  async update(id: string, dto: UpdateSizeDto): Promise<Size> {
    const size = await this.findOne(id);
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      size.category = category;
    }
    if (dto.name !== undefined) size.name = dto.name;
    if (dto.sortOrder !== undefined) size.sortOrder = dto.sortOrder;
    return await this.sizeRepo.save(size);
  }

  async remove(id: string): Promise<void> {
    const size = await this.findOne(id);
    await this.sizeRepo.remove(size);
  }
}


