import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, ValidateIf, IsUrl } from 'class-validator';

/** Các khoá được phép ghi. Thêm link mới = thêm 1 dòng ở đây + 1 field bên dưới. */
export const SITE_SETTING_KEYS = ['partnership_pdf_url'] as const;
export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export class SiteSettingsDto {
  @ApiProperty({
    nullable: true,
    example: 'https://cdn.mingo.vn/ho-so-hop-tac.pdf',
    description: 'Link file PDF hồ sơ hợp tác do khách cung cấp. null = chưa cấu hình.',
  })
  partnership_pdf_url: string | null;
}

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({
    example: 'https://cdn.mingo.vn/ho-so-hop-tac.pdf',
    description: 'Chuỗi rỗng để xoá link.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  // Chuỗi rỗng = xoá cấu hình, nên chỉ validate URL khi có nhập.
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  partnership_pdf_url?: string;
}
