import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHomepageBannerDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/.../banner-captain-hopper.jpg',
    description: 'Banner image URL, from /files/upload(-multiple)',
  })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  image_url: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/.../hero-loop.mp4',
    description: 'Optional background video (mp4). When set, storefront autoplays it (muted/loop) with image_url as poster/fallback.',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  video_url?: string;

  @ApiPropertyOptional({ example: 'Captain Hopper for Kids ice cream' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt_text?: string;

  @ApiPropertyOptional({
    example: '/products/creme-caramel',
    description: 'Optional CTA target when the banner is clicked',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  link_url?: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Lower shows first' })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
