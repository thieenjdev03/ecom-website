import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCollectionDto {
  @ApiPropertyOptional({ 
    example: 20,
    description: 'Number of items per page',
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ==',
    description: 'Cursor token for pagination'
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    example: 'must_try',
    description: 'Filter collections by their homepage section marker',
  })
  @IsOptional()
  @IsString()
  homepage_section?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Locale used to resolve product name/slug/description when fetching a collection\'s products (default: en)',
    enum: ['en', 'vi'],
  })
  @IsOptional()
  @IsString()
  locale?: string = 'en';
}

