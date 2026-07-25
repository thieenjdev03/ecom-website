import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCareerDto {
  @ApiPropertyOptional({ example: 'Marketing' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Fresher' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'closed'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'closed'])
  status?: 'draft' | 'published' | 'closed';

  @ApiPropertyOptional({ description: 'Search in title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Cursor token for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
