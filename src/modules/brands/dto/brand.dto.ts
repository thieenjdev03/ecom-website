import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ example: 'Impact' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'impact' })
  @IsString()
  @MaxLength(280)
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

export class QueryBrandDto {
  @ApiPropertyOptional({ description: 'Only active brands' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  active?: boolean;
}

export class BrandDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Impact' })
  name: string;

  @ApiProperty({ example: 'impact' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  logo_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  display_order: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;
}
