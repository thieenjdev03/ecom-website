import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
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
}

