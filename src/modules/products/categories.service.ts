import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check slug uniqueness
    const existingSlug = await this.categoriesRepository.findOne({
      where: { slug: createCategoryDto.slug },
    });
    if (existingSlug) {
      throw new BadRequestException(`Slug "${createCategoryDto.slug}" already exists`);
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { display_order: 'ASC', name: 'ASC' },
    });
  }

  async findAllForAdmin(withChildren: boolean): Promise<Category[]> {
    return this.categoriesRepository.find({
      relations: withChildren ? ['children', 'parent'] : ['parent'],
      order: { display_order: 'ASC' },
    });
  }

  async findActive(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { is_active: true },
      order: { display_order: 'ASC', name: 'ASC' },
    });
  }

  async findTree(onlyActive: boolean): Promise<Category[]> {
    const where = onlyActive ? { parent: IsNull(), is_active: true } : { parent: IsNull() };
    return this.categoriesRepository.find({
      where,
      relations: ['children'],
      order: { display_order: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Check slug uniqueness if changing
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingSlug = await this.categoriesRepository.findOne({
        where: { slug: updateCategoryDto.slug },
      });
      if (existingSlug) {
        throw new BadRequestException(`Slug "${updateCategoryDto.slug}" already exists`);
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }
}
