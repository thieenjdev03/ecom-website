import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryHomepageBannerDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Filter to only active banners (used by the storefront)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  active?: boolean;
}
