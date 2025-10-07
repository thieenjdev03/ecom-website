import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const exists = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Slug already exists');

    let parent: Category | null = null;
    if (dto.parentId) {
      parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const entity = this.categoryRepo.create({ name: dto.name, slug: dto.slug, parent: parent || undefined });
    return await this.categoryRepo.save(entity);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find({ relations: ['parent', 'children'] });
  }

  async findOne(id: string): Promise<Category> {
    const cat = await this.categoryRepo.findOne({ where: { id }, relations: ['parent', 'children'] });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const cat = await this.findOne(id);

    if (dto.slug && dto.slug !== cat.slug) {
      const conflict = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (conflict) throw new ConflictException('Slug already exists');
    }

    let parent: Category | null = null;
    if (dto.parentId) {
      parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    Object.assign(cat, { name: dto.name ?? cat.name, slug: dto.slug ?? cat.slug, parent: dto.parentId ? parent! : cat.parent });
    return await this.categoryRepo.save(cat);
  }

  async remove(id: string): Promise<void> {
    const cat = await this.findOne(id);
    await this.categoryRepo.remove(cat);
  }
}


