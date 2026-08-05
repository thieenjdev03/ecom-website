import { IsInt, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({ format: 'uuid', description: 'Product to add to the cart' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1, description: 'Quantity to add (added on top of any existing quantity)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}
