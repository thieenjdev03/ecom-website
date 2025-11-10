import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'T-Shirts' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 't-shirts' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: 'All types of t-shirts' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/category.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string;

  @ApiPropertyOptional({ example: 'b4b2b07f-6825-402b-bd2c-f9aef8cfbba5' })
  @IsOptional()
  @Transform(({ value }) => {
    // Convert 0, empty string, or null to undefined (no parent)
    if (value === 0 || value === '0' || value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  display_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
