import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, Min, Max, ValidateNested, ValidateIf, IsEnum, MaxLength, IsUUID, IsObject, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariantDto } from './product-variant.dto';
import { DimensionsDto } from './dimensions.dto';
import { LocalizedStringDto } from './localized-string.dto';
import { IsLocalizedNotEmpty, IsLocalizedSlug } from '../../../common/validators/localized-string.validators';

export class CreateProductDto {
  @ApiProperty({
    type: () => LocalizedStringDto,
    example: { en: 'Premium Polo Shirt', vi: 'Áo Polo Cao Cấp' },
    description: 'Product name in multiple languages'
  })
  @IsLocalizedNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ApiProperty({
    type: () => LocalizedStringDto,
    example: { en: 'premium-polo-shirt', vi: 'ao-polo-cao-cap' },
    description: 'Product slug in multiple languages'
  })
  @IsLocalizedNotEmpty()
  @IsLocalizedSlug()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  slug: LocalizedStringDto;

  @ApiPropertyOptional({
    type: () => LocalizedStringDto,
    example: { en: '<p>High quality vanilla ice cream.</p>', vi: '<p>Kem vani chất lượng cao.</p>' },
    description: 'Product description HTML in multiple languages. Unsafe tags and attributes are removed before storage.'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiPropertyOptional({
    type: () => LocalizedStringDto,
    example: { en: '<p>Contains <strong>milk and soy</strong>.</p>', vi: '<p>Có chứa <strong>sữa và đậu nành</strong>.</p>' },
    description: 'Ingredients and allergen information HTML in multiple languages. Unsafe tags and attributes are removed before storage.'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  short_description?: LocalizedStringDto;

  @ApiPropertyOptional({
    type: () => LocalizedStringDto,
    example: {
      en: '<ol><li>Soften for 5 minutes before serving.</li><li>Consume immediately after opening.</li></ol>',
      vi: '<ol><li>Để kem mềm 5 phút trước khi dùng.</li><li>Dùng ngay sau khi mở hộp.</li></ol>',
    },
    description: 'Deprecated compatibility alias for usage instructions HTML. New clients should send usage_instructions.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  nutrition_information?: LocalizedStringDto;

  @ApiPropertyOptional({
    type: () => LocalizedStringDto,
    example: {
      en: '<ol><li>Soften for 5 minutes before serving.</li><li>Consume immediately after opening.</li></ol>',
      vi: '<ol><li>Để kem mềm 5 phút trước khi dùng.</li><li>Dùng ngay sau khi mở hộp.</li></ol>',
    },
    description: 'Usage instructions HTML in multiple languages. Stored in the existing nutrition_information column.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  usage_instructions?: LocalizedStringDto;

  @ApiPropertyOptional({
    type: () => LocalizedStringDto,
    example: { en: '<p>Keep frozen. Do not refreeze after thawing.</p>', vi: '<p>Bảo quản đông lạnh.</p>' },
    description: 'Sanitized notes / cautions HTML in multiple languages',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  notes?: LocalizedStringDto;

  @ApiPropertyOptional({ example: 399000, nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'price must be a number / giá phải là một con số' })
  @Min(0, { message: 'price cannot be negative / giá không được nhỏ hơn 0' })
  price?: number | null;

  @ApiPropertyOptional({ example: 349000 })
  @IsOptional()
  @IsNumber({}, { message: 'sale_price must be a number / giá khuyến mãi phải là một con số' })
  @Min(0, { message: 'sale_price cannot be negative / giá khuyến mãi không được nhỏ hơn 0' })
  sale_price?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber({}, { message: 'cost_price must be a number / giá vốn phải là một con số' })
  @Min(0, { message: 'cost_price cannot be negative / giá vốn không được nhỏ hơn 0' })
  cost_price?: number;

  @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'] })
  @IsOptional()
  @IsArray({ message: 'images must be an array of URLs / danh sách ảnh phải là một mảng URL' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true, message: 'each image must be a valid http(s) URL / mỗi ảnh phải là một URL hợp lệ' },
  )
  images?: string[];

  @ApiPropertyOptional({ type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber({}, { message: 'stock_quantity must be a number / tồn kho phải là một con số' })
  @Min(0, { message: 'stock_quantity cannot be negative / tồn kho không được nhỏ hơn 0' })
  stock_quantity?: number;

  @ApiPropertyOptional({ example: 'POLO-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'sku must not exceed 100 characters / SKU không được vượt quá 100 ký tự' })
  sku?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'barcode must not exceed 100 characters / mã vạch không được vượt quá 100 ký tự' })
  barcode?: string;

  @ApiPropertyOptional({ example: 'b4b2b07f-6825-402b-bd2c-f9aef8cfbba5' })
  @IsOptional()
  @IsUUID('4', { message: 'category_id must be a valid UUID / category_id không hợp lệ' })
  category_id?: string;

  @ApiPropertyOptional({
    example: 'b4b2b07f-6825-402b-bd2c-f9aef8cfbba5',
    nullable: true,
    description: 'Brand UUID. Pass null to clear the brand on update.',
  })
  @IsOptional()
  @ValidateIf((o) => o.brand_id !== null)
  @IsUUID('4', { message: 'brand_id must be a valid UUID or null / brand_id không hợp lệ' })
  brand_id?: string | null;

  @ApiPropertyOptional({ example: ['polo', 'men', 'premium'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'draft'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'], {
    message: 'status must be one of: active, inactive, draft / trạng thái không hợp lệ',
  })
  status?: 'active' | 'inactive' | 'draft';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  enable_sale_tag?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Show a contact-for-quote CTA instead of a numeric product price.' })
  @IsOptional()
  @IsBoolean()
  is_contact_for_price?: boolean;

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
