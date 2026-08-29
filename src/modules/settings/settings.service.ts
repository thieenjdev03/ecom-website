import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSetting } from './entities/site-setting.entity';
import { SITE_SETTING_KEYS, SiteSettingsDto, UpdateSiteSettingsDto } from './dto/site-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSetting)
    private readonly repo: Repository<SiteSetting>,
  ) {}

  async findAll(): Promise<SiteSettingsDto> {
    const rows = await this.repo.find();
    const stored = new Map(rows.map((row) => [row.key, row.value]));
    return { partnership_pdf_url: stored.get('partnership_pdf_url') ?? null };
  }

  async update(dto: UpdateSiteSettingsDto): Promise<SiteSettingsDto> {
    for (const key of SITE_SETTING_KEYS) {
      const value = dto[key];
      if (value === undefined) continue;
      // Chuỗi rỗng = gỡ cấu hình, để storefront quay lại hành vi mặc định.
      if (value === '') await this.repo.delete({ key });
      else await this.repo.upsert({ key, value }, ['key']);
    }
    return this.findAll();
  }
}
