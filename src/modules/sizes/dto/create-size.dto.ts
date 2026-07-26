import { IsString, IsOptional, IsUUID, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSizeDto {
  @ApiProperty({ example: '24 cây / thùng', description: 'Display label (quy cách / kích cỡ)' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Category scope (optional)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'cây', description: "Đơn vị lẻ: 'cây', 'hộp', 'lít'..." })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ example: 24, description: 'Số lượng / thùng (case pack)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  packQty?: number;

  @ApiPropertyOptional({ example: 250, description: 'Dung tích (ml)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  volumeMl?: number;

  @ApiPropertyOptional({ example: 0, description: 'Sort order' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
