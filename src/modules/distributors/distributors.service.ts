import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Distributor } from './entities/distributor.entity';
import { Category } from '../products/entities/category.entity';
import { Collection } from '../collections/entities/collection.entity';
import { CreateDistributorDto } from './dto/create-distributor.dto';
import { UpdateDistributorDto } from './dto/update-distributor.dto';
import { QueryDistributorDto } from './dto/query-distributor.dto';
import { extractAndValidateMapsSrc } from './utils/maps-embed.util';
import { slugifyVietnamese } from './utils/slug.util';

export interface PaginatedDistributors {
  data: Distributor[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class DistributorsService {
  constructor(
    @InjectRepository(Distributor)
    private distributorsRepository: Repository<Distributor>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Collection)
    private collectionsRepository: Repository<Collection>,
  ) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugifyVietnamese(name);
    let slug = base;
    let i = 2;
    while (await this.distributorsRepository.findOne({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  private async resolveCategories(ids: string[]): Promise<Category[]> {
    if (!ids?.length) return [];
    const clean = [...new Set(ids)];
    const found = await this.categoriesRepository.findBy({ id: In(clean) });
    if (found.length !== clean.length) {
      throw new BadRequestException('Some categoryIds do not exist');
    }
    return found;
  }

  private async resolveCollections(ids: string[]): Promise<Collection[]> {
    if (!ids?.length) return [];
    const clean = [...new Set(ids)];
    const found = await this.collectionsRepository.findBy({ id: In(clean) });
    if (found.length !== clean.length) {
      throw new BadRequestException('Some collectionIds do not exist');
    }
    return found;
  }

  async create(dto: CreateDistributorDto): Promise<Distributor> {
    const maps_embed_src = extractAndValidateMapsSrc(dto.maps_embed);
    const slug = await this.generateUniqueSlug(dto.name);
    const [categories, collections] = await Promise.all([
      this.resolveCategories(dto.category_ids),
      this.resolveCollections(dto.collection_ids),
    ]);

    const distributor = this.distributorsRepository.create({
      name: dto.name,
      slug,
      address_line: dto.address_line,
      district_text: dto.district_text ?? null,
      ward_code: dto.ward_code,
      ward_name: dto.ward_name,
      province_code: dto.province_code,
      province_name: dto.province_name,
      description: dto.description ?? null,
      maps_embed_src,
      is_active: dto.is_active ?? true,
      categories,
      collections,
    });

    const saved = await this.distributorsRepository.save(distributor);
    return this.findOne(saved.id);
  }

  async findAll(query: QueryDistributorDto): Promise<PaginatedDistributors> {
    const { q, province_code, ward_code, category_id, collection_id, is_active, page = 1, limit = 20 } = query;

    const qb = this.distributorsRepository
      .createQueryBuilder('distributor')
      .leftJoinAndSelect('distributor.categories', 'category')
      .leftJoinAndSelect('distributor.collections', 'collection');

    if (q) {
      qb.andWhere('(distributor.name ILIKE :q OR distributor.address_line ILIKE :q)', { q: `%${q}%` });
    }
    if (province_code) {
      qb.andWhere('distributor.province_code = :province_code', { province_code });
    }
    if (ward_code) {
      qb.andWhere('distributor.ward_code = :ward_code', { ward_code });
    }
    if (typeof is_active === 'boolean') {
      qb.andWhere('distributor.is_active = :is_active', { is_active });
    }
    if (category_id) {
      qb.andWhere('EXISTS (SELECT 1 FROM distributor_categories dc WHERE dc.distributor_id = distributor.id AND dc.category_id = :category_id)', {
        category_id,
      });
    }
    if (collection_id) {
      qb.andWhere('EXISTS (SELECT 1 FROM distributor_collections dcl WHERE dcl.distributor_id = distributor.id AND dcl.collection_id = :collection_id)', {
        collection_id,
      });
    }

    qb.orderBy('distributor.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Distributor> {
    const distributor = await this.distributorsRepository.findOne({
      where: { id },
      relations: ['categories', 'collections'],
    });
    if (!distributor) {
      throw new NotFoundException(`Distributor ${id} not found`);
    }
    return distributor;
  }

  async update(id: string, dto: UpdateDistributorDto): Promise<Distributor> {
    const distributor = await this.findOne(id);

    if (dto.maps_embed) {
      distributor.maps_embed_src = extractAndValidateMapsSrc(dto.maps_embed);
    }
    if (dto.name && dto.name !== distributor.name) {
      distributor.name = dto.name;
      distributor.slug = await this.generateUniqueSlug(dto.name);
    }
    if (dto.address_line !== undefined) distributor.address_line = dto.address_line;
    if (dto.district_text !== undefined) distributor.district_text = dto.district_text ?? null;
    if (dto.ward_code !== undefined) distributor.ward_code = dto.ward_code;
    if (dto.ward_name !== undefined) distributor.ward_name = dto.ward_name;
    if (dto.province_code !== undefined) distributor.province_code = dto.province_code;
    if (dto.province_name !== undefined) distributor.province_name = dto.province_name;
    if (dto.description !== undefined) distributor.description = dto.description ?? null;
    if (dto.is_active !== undefined) distributor.is_active = dto.is_active;

    if (dto.category_ids !== undefined) {
      distributor.categories = await this.resolveCategories(dto.category_ids);
    }
    if (dto.collection_ids !== undefined) {
      distributor.collections = await this.resolveCollections(dto.collection_ids);
    }

    await this.distributorsRepository.save(distributor);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const distributor = await this.findOne(id);
    await this.distributorsRepository.remove(distributor);
  }
}
