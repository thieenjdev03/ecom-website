import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryProductDto {
  @ApiPropertyOptional({ example: 'en', description: 'Locale for language (default: en)', enum: ['en', 'vi'] })
  @IsOptional()
  @IsString()
  locale?: string = 'en';
  @ApiPropertyOptional({ example: 'b4b2b07f-6825-402b-bd2c-f9aef8cfbba5', description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: 'c5c5d08f-7936-503c-ce3d-g0bgf9cfccb6', description: 'Filter by collection ID' })
  @IsOptional()
  @IsUUID()
  collection_id?: string;

  @ApiPropertyOptional({ enum: ['active', 'draft', 'out_of_stock', 'discontinued'] })
  @IsOptional()
  @IsEnum(['active', 'draft', 'out_of_stock', 'discontinued'])
  status?: 'active' | 'draft' | 'out_of_stock' | 'discontinued';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enable_sale_tag?: boolean;

  @ApiPropertyOptional({ example: 'polo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'created_at', enum: ['created_at', 'updated_at', 'name', 'price', 'status'] })
  @IsOptional()
  @IsEnum(['created_at', 'updated_at', 'name', 'price', 'status'])
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'price' | 'status' = 'created_at';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
