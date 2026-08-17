import { IsString, IsNumber, IsOptional, Min, IsUUID, IsUrl, ValidateNested, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocalizedStringDto } from './localized-string.dto';
import { IsLocalizedNotEmpty } from '../../../common/validators/localized-string.validators';

export class ProductVariantDto {
  @ApiProperty({
    type: () => LocalizedStringDto,
    example: { en: 'M - Black', vi: 'M - Đen' },
    description: 'Variant name in multiple languages'
  })
  @IsLocalizedNotEmpty({ message: 'variant name must include at least one non-empty translation / tên biến thể phải có ít nhất một ngôn ngữ' })
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ApiProperty({ example: 'POLO-M-BLACK' })
  @IsString({ message: 'variant sku must be a string / SKU biến thể phải là chuỗi' })
  @IsNotEmpty({ message: 'variant sku is required / SKU biến thể là bắt buộc' })
  sku: string;

  @ApiProperty({ example: 399000 })
  @Type(() => Number)
  @IsNumber({}, { message: 'variant price must be a number / giá biến thể phải là một con số' })
  @Min(0, { message: 'variant price cannot be negative / giá biến thể không được nhỏ hơn 0' })
  price: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt({ message: 'variant stock must be an integer / tồn kho biến thể phải là số nguyên' })
  @Min(0, { message: 'variant stock cannot be negative / tồn kho biến thể không được nhỏ hơn 0' })
  stock: number;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: '44fd41a7-63b1-41f6-b05d-1935d392f1d4' })
  @IsOptional()
  @IsUUID('4', { message: 'color_id must be a valid UUID / color_id không hợp lệ' })
  color_id?: string;

  @ApiPropertyOptional({
    example: '07bdcefc-da8a-4b29-9945-602abb4adc02',
    description: 'Optional packaging size reference; variant name remains the fallback label',
  })
  @IsOptional()
  @IsUUID('4', { message: 'size_id must be a valid UUID / size_id không hợp lệ' })
  size_id?: string;

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
