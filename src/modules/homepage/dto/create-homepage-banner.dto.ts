import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHomepageBannerDto {
  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/.../banner-captain-hopper.jpg',
    description: 'Optional banner image URL, from /files/upload(-multiple). At least one of image_url or video_url is required.',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  image_url?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/.../hero-loop.mp4',
    description: 'Optional background video (mp4). At least one of image_url or video_url is required; both may be provided.',
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
