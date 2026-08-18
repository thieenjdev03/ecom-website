import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto, UpdateBrandDto, QueryBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) {}

  private async assertSlugFree(slug: string): Promise<void> {
    const existing = await this.brandsRepository.findOne({
      where: { slug },
    });
    if (existing) throw new ConflictException(`Brand with slug "${slug}" already exists`);
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    await this.assertSlugFree(dto.slug);
    return this.brandsRepository.save(this.brandsRepository.create(dto));
  }

  async findAll(query: QueryBrandDto): Promise<Brand[]> {
    return this.brandsRepository.find({
      where: query.active ? { is_active: true } : {},
      order: { display_order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({ where: { id } });
    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);
    return brand;
  }

  async findBySlug(slug: string): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({ where: { slug } });
    if (!brand) throw new NotFoundException(`Brand with slug "${slug}" not found`);
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);
    if (dto.slug && dto.slug !== brand.slug) await this.assertSlugFree(dto.slug);
    Object.assign(brand, dto);
    return this.brandsRepository.save(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);
    await this.brandsRepository.remove(brand);
  }
}
