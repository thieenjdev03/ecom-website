import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetShippingPriceDto {
  @IsString()
  country: string;

  @IsString()
  province: string;

  @IsString()
  district: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  weight: number;

  @IsOptional()
  @IsString()
  method?: string;
}


