import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, Min, Max, ValidateNested, IsEnum, MaxLength, IsUUID, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariantDto } from './product-variant.dto';
import { DimensionsDto } from './dimensions.dto';
import { LangObject } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ 
    example: { en: 'Premium Polo Shirt', vi: 'Áo Polo Cao Cấp' },
    description: 'Product name in multiple languages'
  })
  @IsObject()
  name: LangObject;

  @ApiProperty({ 
    example: { en: 'premium-polo-shirt', vi: 'ao-polo-cao-cap' },
    description: 'Product slug in multiple languages'
  })
  @IsObject()
  slug: LangObject;

  @ApiPropertyOptional({ 
    example: { en: 'High quality cotton polo shirt...', vi: 'Áo polo cotton chất lượng cao...' },
    description: 'Product description in multiple languages'
  })
  @IsOptional()
  @IsObject()
  description?: LangObject;

  @ApiPropertyOptional({ 
    example: { en: 'Premium cotton polo', vi: 'Áo polo cotton cao cấp' },
    description: 'Short description in multiple languages'
  })
  @IsOptional()
  @IsObject()
  short_description?: LangObject;

  @ApiProperty({ example: 399000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 349000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sale_price?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost_price?: number;

  @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @ApiPropertyOptional({ example: 'POLO-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: 'b4b2b07f-6825-402b-bd2c-f9aef8cfbba5' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: ['polo', 'men', 'premium'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'])
  status?: 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'discontinued';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  enable_sale_tag?: boolean;

  @ApiPropertyOptional({ 
    example: { en: 'Buy Premium Polo Shirt', vi: 'Mua Áo Polo Cao Cấp' },
    description: 'Meta title in multiple languages'
  })
  @IsOptional()
  @IsObject()
  meta_title?: LangObject | null;

  @ApiPropertyOptional({ 
    example: { en: 'High quality polo shirt...', vi: 'Áo polo chất lượng cao...' },
    description: 'Meta description in multiple languages'
  })
  @IsOptional()
  @IsObject()
  meta_description?: LangObject | null;

  @ApiPropertyOptional({ example: 0.3, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ 
    type: DimensionsDto,
    example: { length: 28, width: 20, height: 2 },
    description: 'Product dimensions in cm'
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;
}
