import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({ format: 'uuid', description: 'Product to add to the cart' })
  @IsUUID()
  productId: string;

  @ApiProperty({
    required: false,
    example: 'CREME-CARAMEL-30-PACK',
    description: 'Required when purchasing a product packaging variant',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  variantSku?: string;

  @ApiProperty({ example: 1, description: 'Quantity to add (added on top of any existing quantity)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}
