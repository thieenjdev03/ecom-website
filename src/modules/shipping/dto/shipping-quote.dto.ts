import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShippingQuoteDto {
  @ApiProperty({ example: '79', description: 'Vietnam province/city code' })
  @IsString()
  @IsNotEmpty()
  province_code: string;

  @ApiProperty({ example: '760', description: 'Vietnam district code' })
  @IsString()
  @IsNotEmpty()
  district_code: string;
}
