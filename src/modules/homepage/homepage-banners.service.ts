import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomepageBanner } from './entities/homepage-banner.entity';
import { CreateHomepageBannerDto } from './dto/create-homepage-banner.dto';
import { UpdateHomepageBannerDto } from './dto/update-homepage-banner.dto';
import { QueryHomepageBannerDto } from './dto/query-homepage-banner.dto';

@Injectable()
export class HomepageBannersService {
  constructor(
    @InjectRepository(HomepageBanner)
    private readonly bannersRepository: Repository<HomepageBanner>,
  ) {}

  async create(dto: CreateHomepageBannerDto): Promise<HomepageBanner> {
    const banner = this.bannersRepository.create(dto);
    return this.bannersRepository.save(banner);
  }

  async findAll(query: QueryHomepageBannerDto): Promise<HomepageBanner[]> {
    const where = query.active ? { is_active: true } : {};
    return this.bannersRepository.find({
      where,
      order: { display_order: 'ASC', created_at: 'ASC' },
    });
  }

  async findOne(id: string): Promise<HomepageBanner> {
    const banner = await this.bannersRepository.findOne({ where: { id } });
    if (!banner) throw new NotFoundException(`Homepage banner with ID "${id}" not found`);
    return banner;
  }

  async update(id: string, dto: UpdateHomepageBannerDto): Promise<HomepageBanner> {
    const banner = await this.findOne(id);
    Object.assign(banner, dto);
    return this.bannersRepository.save(banner);
  }

  async remove(id: string): Promise<void> {
    const banner = await this.findOne(id);
    await this.bannersRepository.softRemove(banner);
  }
}
