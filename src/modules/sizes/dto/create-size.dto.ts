import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateSizeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}


