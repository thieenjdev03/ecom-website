import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, Min, Max, ValidateNested, IsEnum, MaxLength, IsUUID, IsObject, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariantDto } from './product-variant.dto';
import { DimensionsDto } from './dimensions.dto';
import { LocalizedStringDto } from './localized-string.dto';

export class CreateProductDto {
  @ApiProperty({
    type: () => LocalizedStringDto,
    example: { en: 'Premium Polo Shirt', vi: 'Áo Polo Cao Cấp' },
    description: 'Product name in multiple languages'
  })
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ApiProperty({
    type: () => LocalizedStringDto,
    example: { en: 'premium-polo-shirt', vi: 'ao-polo-cao-cap' },
    description: 'Product slug in multiple languages'
  })
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  slug: LocalizedStringDto;

  @ApiPropertyOptional({
    type: () => LocalizedStringDto,
    example: { en: 'High quality cotton polo shirt...', vi: 'Áo polo cotton chất lượng cao...' },
    description: 'Product description in multiple languages'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiPropertyOptional({
    type: () => LocalizedStringDto,
    example: { en: 'Premium cotton polo', vi: 'Áo polo cotton cao cấp' },
    description: 'Short description in multiple languages'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  short_description?: LocalizedStringDto;

  @ApiProperty({ example: 399000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 349000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sale_price?: number;

  @ApiPropertyOptional({ example: 45000, description: 'Original/list price displayed before a discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compare_at_price?: number;

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
    type: () => LocalizedStringDto,
    example: { en: 'Buy Premium Polo Shirt', vi: 'Mua Áo Polo Cao Cấp' },
    description: 'Meta title in multiple languages'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  meta_title?: LocalizedStringDto | null;

  @ApiPropertyOptional({
    type: () => LocalizedStringDto,
    example: { en: 'High quality polo shirt...', vi: 'Áo polo chất lượng cao...' },
    description: 'Meta description in multiple languages'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  meta_description?: LocalizedStringDto | null;

  @ApiPropertyOptional({ example: 0.3, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: 90, description: 'Canonical product weight in grams' })
  @IsOptional()
  @IsInt()
  @Min(1)
  weight_grams?: number;

  @ApiPropertyOptional({ example: ['milk', 'soy'], description: 'Known food allergens' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @ApiPropertyOptional({ example: { calories: 180, protein_g: 4, sugar_g: 16 } })
  @IsOptional()
  @IsObject()
  nutrition?: Record<string, string | number>;

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

  @ApiPropertyOptional({ example: 'Hộp giấy', description: 'Quy cách: loại đóng gói' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  packaging_type?: string;

  @ApiPropertyOptional({ example: 12, description: 'Quy cách: số lượng trong một đóng gói' })
  @IsOptional()
  @IsInt()
  @Min(1)
  packaging_quantity?: number;
}
