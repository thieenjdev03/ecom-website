import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SizeCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class SizeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '24 cây / thùng' })
  name: string;

  @ApiPropertyOptional({ nullable: true, example: 'cây' })
  unit: string | null;

  @ApiPropertyOptional({ nullable: true, example: 24, description: 'Số lượng / thùng' })
  packQty: number | null;

  @ApiPropertyOptional({ nullable: true, example: 250, description: 'Dung tích (ml)' })
  volumeMl: number | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: [SizeCategoryDto] })
  categories: SizeCategoryDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
