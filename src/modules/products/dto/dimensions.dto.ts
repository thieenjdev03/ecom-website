import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DimensionsDto {
  @ApiPropertyOptional({ example: 28, description: 'Length in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({ example: 20, description: 'Width in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: 2, description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;
}


