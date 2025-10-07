import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ColorDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ description: 'Hex color code' })
  hexCode?: string;
}

export class SizeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ format: 'uuid' })
  category?: { id: string } | null;

  @ApiProperty()
  sortOrder: number;
}

export class ProductVariantDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: () => ColorDto })
  color: ColorDto;

  @ApiProperty({ type: () => SizeDto })
  size: SizeDto;

  @ApiProperty()
  sku: string;

  @ApiProperty({ type: 'number', format: 'decimal' })
  price: number;

  @ApiPropertyOptional({ type: 'number', format: 'decimal' })
  salePrice?: number | null;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  imageUrl?: string | null;

  @ApiProperty()
  isAvailable: boolean;
}

export class ProductDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  productCode: string;

  @ApiPropertyOptional()
  productSku?: string | null;

  @ApiProperty({ description: 'Category relation' })
  category: { id: string; name?: string };

  @ApiProperty()
  quantity: number;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ type: [String] })
  gender: string[];

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiPropertyOptional()
  saleLabel?: string | null;

  @ApiPropertyOptional()
  newLabel?: string | null;

  @ApiProperty()
  isSale: boolean;

  @ApiProperty()
  isNew: boolean;

  @ApiProperty({ type: () => [ProductVariantDto] })
  variants: ProductVariantDto[];

  @ApiProperty({ type: () => [ColorDto] })
  colors: ColorDto[];

  @ApiProperty({ type: () => [SizeDto] })
  sizes: SizeDto[];
}


