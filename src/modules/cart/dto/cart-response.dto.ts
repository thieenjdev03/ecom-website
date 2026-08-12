import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemProductDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true, description: 'First product image, or null' })
  image: string | null;

  @ApiProperty({ description: 'Current stock available for this product' })
  stock: number;

  @ApiProperty({ description: 'Whether the product can currently be purchased' })
  available: boolean;
}

export class CartItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional({ nullable: true, description: 'Selected packaging variant SKU' })
  variantSku: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Selected packaging variant label' })
  variantName: string | null;

  @ApiProperty({ description: 'Effective unit price (sale_price ?? price)' })
  unitPrice: number;

  @ApiProperty({ description: 'unitPrice × quantity' })
  lineTotal: number;

  @ApiProperty({ type: () => CartItemProductDto })
  product: CartItemProductDto;
}

export class CartResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: () => [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ description: 'Sum of every line total' })
  subtotal: number;

  @ApiProperty({ description: 'Sum of every item quantity' })
  totalQuantity: number;

  @ApiProperty({ description: 'True when every line is available and within stock' })
  valid: boolean;
}
