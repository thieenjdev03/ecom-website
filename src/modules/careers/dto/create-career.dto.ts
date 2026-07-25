import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsArray,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCareerDto {
  @ApiProperty({ example: 'Content Marketing' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Auto-generated from title if omitted' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  slug?: string;

  @ApiPropertyOptional({ example: 'Marketing' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: 'Fresher' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  level?: string;

  @ApiProperty({ description: 'HTML content (sanitized on save)' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Cover image URL from /files/upload. Also accepts `coverUrl`.' })
  @Expose({ name: 'coverUrl' })
  @Transform(({ value, obj }) => value ?? obj.cover_url)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_url?: string;

  // Admin UI sends camelCase, older clients snake_case. @Expose pulls in `isPrimary`
  // (otherwise ValidationPipe's whitelist drops it silently); @Transform keeps the
  // canonical `is_primary` working, since @Expose alone hides it.
  @ApiPropertyOptional({ default: false, description: 'Also accepts `isPrimary`.' })
  @Expose({ name: 'isPrimary' })
  @Transform(({ value, obj }) => value ?? obj.is_primary)
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'closed'], default: 'draft' })
  @IsOptional()
  @IsIn(['draft', 'published', 'closed'])
  status?: 'draft' | 'published' | 'closed';

  @ApiPropertyOptional({ type: [String], description: 'Related career IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subCareerIds?: string[];
}
