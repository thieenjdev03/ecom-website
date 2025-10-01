import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FullProductDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'] as any)
  status?: 'draft' | 'published' | 'archived';
}

export class FullVariantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Min(0)
  priceOriginal?: number;

  @Min(0)
  priceFinal: number;

  @IsString()
  currency: string;

  @IsInt()
  @Min(0)
  stockOnHand: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
}

export class FullMediaDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsEnum(['image', 'video'] as any)
  type?: 'image' | 'video';

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isHover?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  alt?: string;
}

export class DefaultVariantSelectorDto {
  @IsString()
  by: 'id' | 'sku';

  @IsString()
  value: string;
}

export class CreateFullProductDto {
  @ValidateNested()
  @Type(() => FullProductDto)
  product: FullProductDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FullVariantDto)
  variants: FullVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FullMediaDto)
  media?: FullMediaDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DefaultVariantSelectorDto)
  defaultVariant?: DefaultVariantSelectorDto;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}


