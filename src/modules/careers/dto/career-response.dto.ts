import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CareerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Content Marketing' })
  title: string;

  @ApiProperty({ example: 'content-marketing' })
  slug: string;

  @ApiPropertyOptional({ example: 'Marketing', nullable: true })
  category: string | null;

  @ApiPropertyOptional({ example: 'Ho Chi Minh', nullable: true })
  location: string | null;

  @ApiPropertyOptional({ example: 'Fresher', nullable: true })
  level: string | null;

  @ApiProperty({ description: 'Sanitized HTML' })
  content: string;

  @ApiPropertyOptional({ nullable: true, description: 'Cover image URL' })
  cover_url: string | null;

  @ApiProperty()
  is_primary: boolean;

  @ApiProperty({ enum: ['draft', 'published', 'closed'] })
  status: 'draft' | 'published' | 'closed';

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  published_at: Date | null;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;

  @ApiPropertyOptional({ type: () => [CareerDto], description: 'Related careers (detail endpoint only)' })
  subCareers?: CareerDto[];
}

export class CareerListDto {
  @ApiProperty({ type: [CareerDto] })
  items: CareerDto[];

  @ApiProperty({ type: String, nullable: true, description: 'Cursor token for the next page' })
  nextCursor: string | null;
}
