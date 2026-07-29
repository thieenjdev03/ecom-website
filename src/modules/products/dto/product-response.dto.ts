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

  @ApiProperty({ format: 'uuid' })
  size_id: string;

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

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  short_description: string | null;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional({ nullable: true })
  sale_price: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Original/list price before a discount' })
  compare_at_price: number | null;

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

  @ApiPropertyOptional({ nullable: true, example: 90 })
  weight_grams: number | null;

  @ApiProperty({ type: [String], example: ['milk', 'soy'] })
  allergens: string[];

  @ApiPropertyOptional({ nullable: true, example: { calories: 180, sugar_g: 16 } })
  nutrition: Record<string, string | number> | null;

  @ApiPropertyOptional({ type: () => ProductDimensionsResponseDto, nullable: true })
  dimensions: ProductDimensionsResponseDto | null;

  @ApiPropertyOptional({ nullable: true, example: 'Hộp giấy', description: 'Quy cách: loại đóng gói' })
  packaging_type: string | null;

  @ApiPropertyOptional({ nullable: true, example: 12, description: 'Quy cách: số lượng trong một đóng gói' })
  packaging_quantity: number | null;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;

  @ApiPropertyOptional({ type: () => ProductCategorySummaryDto, nullable: true })
  category?: ProductCategorySummaryDto;

  @ApiProperty({ type: () => [ProductCollectionSummaryDto] })
  collections: ProductCollectionSummaryDto[];

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
