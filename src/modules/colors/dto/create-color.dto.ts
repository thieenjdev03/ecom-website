import { IsOptional, IsString, Matches, IsUrl } from 'class-validator';

export class CreateColorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  hexCode?: string;

  @IsOptional()
  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: true,
    allow_trailing_dot: false,
    require_tld: true,
  })
  imageUrl?: string;
}


