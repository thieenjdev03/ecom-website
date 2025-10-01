import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived' = 'published';

  @IsOptional()
  @IsUUID()
  defaultVariantId?: string;
}
