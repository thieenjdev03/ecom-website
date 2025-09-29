import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string = 'VND';

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'DRAFT'])
  status?: string = 'ACTIVE';

  @IsOptional()
  @IsNumber()
  stock?: number = 0;

  @IsOptional()
  @IsArray()
  images?: string[];
}
