import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateColorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  hexCode?: string;
}


