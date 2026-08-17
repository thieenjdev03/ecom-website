import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListMediaLibraryDto {
  @ApiPropertyOptional({ example: 'products', default: 'products' })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({ description: 'Cloudinary cursor returned by the previous page' })
  @IsOptional()
  @IsString()
  nextCursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxResults?: number;
}

export class MediaLibraryAssetDto {
  @ApiProperty()
  public_id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  thumbnail_url: string;

  @ApiProperty()
  format: string;

  @ApiProperty()
  bytes: number;

  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiProperty()
  created_at: string;
}

export class MediaLibraryResponseDto {
  @ApiProperty({ type: [MediaLibraryAssetDto] })
  items: MediaLibraryAssetDto[];

  @ApiPropertyOptional({ nullable: true })
  next_cursor: string | null;
}
