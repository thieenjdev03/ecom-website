import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategorySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class ProductCollectionSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class ProductBrandSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  logo_url: string | null;
}

export class ProductVariantColorDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  hexCode: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl: string | null;
}

export class ProductVariantSizeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '24 cây / thùng' })
  name: string;

  @ApiPropertyOptional({ nullable: true, example: 'cây' })
  unit?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 24, description: 'Số lượng / thùng' })
  packQty?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 250, description: 'Dung tích (ml)' })
  volumeMl?: number | null;
}

export class ProductVariantResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiPropertyOptional({ nullable: true })
  barcode?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  color_id?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  size_id?: string;

  @ApiPropertyOptional({ nullable: true })
  image_url?: string;

  @ApiPropertyOptional({ type: () => ProductVariantColorDto })
  color?: ProductVariantColorDto;

  @ApiPropertyOptional({ type: () => ProductVariantSizeDto })
  size?: ProductVariantSizeDto;
}

export class ProductDimensionsResponseDto {
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
}

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Sanitized product description HTML resolved for the requested locale',
  })
  description: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Sanitized ingredients and allergen information HTML resolved for the requested locale',
  })
  short_description: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Deprecated compatibility alias for usage instructions HTML. New clients should use usage_instructions.',
  })
  nutrition_information: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Usage instructions HTML resolved for the requested locale. Preferred key for new clients.',
  })
  usage_instructions: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Sanitized notes / cautions HTML resolved for the requested locale',
  })
  notes: string | null;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional({ nullable: true })
  sale_price: number | null;

  @ApiPropertyOptional({ nullable: true })
  cost_price: number | null;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  stock_quantity: number;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;

  @ApiPropertyOptional({ nullable: true })
  barcode: string | null;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ enum: ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'] })
  status: 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'discontinued';

  @ApiProperty()
  is_featured: boolean;

  @ApiProperty()
  enable_sale_tag: boolean;

  @ApiPropertyOptional({ nullable: true })
  meta_title: string | null;

  @ApiPropertyOptional({ nullable: true })
  meta_description: string | null;

  @ApiPropertyOptional({ nullable: true })
  weight: number | null;

  @ApiPropertyOptional({ type: () => ProductDimensionsResponseDto, nullable: true })
  dimensions: ProductDimensionsResponseDto | null;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;

  @ApiPropertyOptional({ type: () => [ProductCollectionSummaryDto] })
  collections?: ProductCollectionSummaryDto[];

  @ApiPropertyOptional({ type: () => ProductCategorySummaryDto, nullable: true })
  category?: ProductCategorySummaryDto;

  @ApiProperty({ type: () => ProductBrandSummaryDto, nullable: true })
  brand: ProductBrandSummaryDto | null;

  @ApiPropertyOptional({ type: () => [ProductVariantResponseDto] })
  variants?: ProductVariantResponseDto[];
}

export class ProductListMetaDto {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class ProductListDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty({ type: () => ProductListMetaDto })
  meta: ProductListMetaDto;
}
