import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductResponseDto } from '../../products/dto/product-response.dto';

export class StorefrontCollectionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  bannerImageUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  mobileBannerImageUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  ctaLabel: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Homepage section this collection powers (e.g. "must_try"). Null when the collection is a generic home section.',
  })
  homepageSection: string | null;

  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];
}

export class StorefrontHomeDto {
  @ApiProperty({ type: [StorefrontCollectionDto] })
  heroCollections: StorefrontCollectionDto[];

  @ApiProperty({ type: [StorefrontCollectionDto] })
  homeSections: StorefrontCollectionDto[];
}
