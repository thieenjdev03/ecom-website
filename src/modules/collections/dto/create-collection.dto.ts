import { IsString, IsOptional, IsBoolean, MaxLength, IsEnum, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ 
    example: 'Summer Collection 2024',
    description: 'Collection name'
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ 
    example: 'summer-collection-2024',
    description: 'Collection slug (auto-generated if not provided)'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({ 
    example: 'Discover our latest summer fashion collection',
    description: 'Collection description'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/banner.jpg',
    description: 'Banner image URL'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  banner_image_url?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner-mobile.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mobile_banner_image_url?: string;

  @ApiPropertyOptional({ example: 'Khám phá ngay' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cta_label?: string;

  @ApiPropertyOptional({ enum: ['HERO', 'HOME_SECTION', 'NORMAL'], default: 'NORMAL' })
  @IsOptional()
  @IsEnum(['HERO', 'HOME_SECTION', 'NORMAL'])
  placement?: 'HERO' | 'HOME_SECTION' | 'NORMAL';

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @IsInt()
  sort_order?: number;

  @ApiPropertyOptional({ 
    example: 'Summer Collection 2024 - Fashion Store',
    description: 'SEO title'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seo_title?: string;

  @ApiPropertyOptional({ 
    example: 'Browse our curated summer collection with the latest trends',
    description: 'SEO description'
  })
  @IsOptional()
  @IsString()
  seo_description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Is collection active',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: 'must_try',
    description: 'Marks this collection as the source for a homepage section (e.g. "must_try"). At most one active collection should claim a given section.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  homepage_section?: string;
}
