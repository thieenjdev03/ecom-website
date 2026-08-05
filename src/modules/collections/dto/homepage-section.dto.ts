import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query params for the homepage sections endpoint.
 * `limit` here means "how many product tiles to preview per section", not a page size.
 */
export class HomepageQueryDto {
  @ApiPropertyOptional({
    example: 8,
    description: 'Number of product tiles to preview per collection section',
    default: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number = 8;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Locale used to resolve product name/slug/description (default: en)',
    enum: ['en', 'vi'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'vi'])
  locale?: string = 'en';

  @ApiPropertyOptional({
    example: 'must_try',
    description: 'Restrict to a single homepage section marker. Omit to return every section.',
  })
  @IsOptional()
  @IsString()
  homepage_section?: string;
}

/**
 * Lean product projection used to fill a collection tile on the homepage.
 * Only the fields a card needs — locale already resolved to plain strings.
 */
export class HomepageProductTileDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  short_description: string | null;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional({ nullable: true })
  sale_price: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'First product image, or null when none' })
  image: string | null;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  stock_quantity: number;

  @ApiProperty({ enum: ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'] })
  status: string;

  @ApiProperty()
  is_featured: boolean;

  @ApiProperty()
  enable_sale_tag: boolean;
}

/**
 * A single homepage section: the collection metadata plus its preview tiles.
 * No collection image is required — the section is represented by its product tiles.
 */
export class HomepageSectionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 'must_try', description: 'Homepage section marker this collection fills' })
  homepage_section: string;

  @ApiProperty({ description: 'Total number of products in the collection (not just previewed tiles)' })
  product_count: number;

  @ApiProperty({ type: () => [HomepageProductTileDto] })
  products: HomepageProductTileDto[];
}
