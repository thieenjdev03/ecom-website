import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateSizeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}


