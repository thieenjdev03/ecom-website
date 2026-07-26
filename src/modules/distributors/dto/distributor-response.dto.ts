import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DistributorCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

class DistributorCollectionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class DistributorDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  address_line: string;

  @ApiPropertyOptional({ nullable: true })
  district_text: string | null;

  @ApiProperty()
  ward_code: string;

  @ApiProperty()
  ward_name: string;

  @ApiProperty()
  province_code: string;

  @ApiProperty()
  province_name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  maps_embed_src: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty({ type: [DistributorCategoryDto] })
  categories: DistributorCategoryDto[];

  @ApiProperty({ type: [DistributorCollectionDto] })
  collections: DistributorCollectionDto[];

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;
}

export class DistributorListDto {
  @ApiProperty({ type: [DistributorDto] })
  data: DistributorDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
