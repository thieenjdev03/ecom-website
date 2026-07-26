import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePolicyDto {
  @ApiProperty({ example: 'Chính sách bảo vệ thông tin khách hàng', description: 'Tên mục chính' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'chinh-sach-bao-ve-thong-tin', description: 'Auto-generated from title if omitted' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  slug?: string;

  @ApiProperty({ example: '<h2>Chính sách</h2><p>Nội dung...</p>', description: 'HTML content (sanitized server-side)' })
  @IsString()
  @IsNotEmpty()
  content: string;

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
