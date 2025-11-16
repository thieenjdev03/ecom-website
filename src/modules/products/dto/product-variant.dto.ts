import { IsString, IsNumber, IsOptional, Min, IsUUID, IsUrl, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LangObject } from '../entities/product.entity';

export class ProductVariantDto {
  @ApiProperty({ 
    example: { en: 'M - Black', vi: 'M - Đen' },
    description: 'Variant name in multiple languages'
  })
  @IsObject()
  name: LangObject;

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

  @ApiProperty({ example: '44fd41a7-63b1-41f6-b05d-1935d392f1d4' })
  @IsUUID()
  color_id: string;

  @ApiProperty({ example: '07bdcefc-da8a-4b29-9945-602abb4adc02' })
  @IsUUID()
  size_id: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../red.jpg' })
  @IsOptional()
  @IsString()
  @IsUrl({ 
    protocols: ['http', 'https'], 
    require_protocol: true,
    allow_underscores: true,
    allow_trailing_dot: false,
    require_tld: true
  })
  image_url?: string;
}
