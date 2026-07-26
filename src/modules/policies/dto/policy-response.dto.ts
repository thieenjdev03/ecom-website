import { ApiProperty } from '@nestjs/swagger';

export class PolicyDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Chính sách bảo vệ thông tin khách hàng' })
  title: string;

  @ApiProperty({ example: 'chinh-sach-bao-ve-thong-tin' })
  slug: string;

  @ApiProperty({ example: '<h2>Chính sách</h2><p>Nội dung...</p>' })
  content: string;

  @ApiProperty()
  display_order: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;
}

// Lightweight item for the sidebar list (no heavy HTML body).
export class PolicyListItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  display_order: number;

  @ApiProperty()
  is_active: boolean;
}
