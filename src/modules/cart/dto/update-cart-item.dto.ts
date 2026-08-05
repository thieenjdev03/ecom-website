import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, description: 'New absolute quantity. 0 removes the line.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  quantity: number;
}
