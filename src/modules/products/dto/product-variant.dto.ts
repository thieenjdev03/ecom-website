import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductVariantDto {
  @ApiProperty({ example: 'M - Black' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'POLO-M-BLACK' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 399000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: '1' })
  @IsString()
  color_id: string;

  @ApiProperty({ example: '1' })
  @IsString()
  size_id: string;  
}
