import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutQuoteDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  shipping_address_id: string;

  @ApiProperty({ example: '79', description: 'Vietnam province/city code' })
  @IsString()
  @IsNotEmpty()
  province_code: string;

  @ApiProperty({ example: '760', description: 'Vietnam district code' })
  @IsString()
  @IsNotEmpty()
  district_code: string;
}

export class CreateCheckoutOrderDto extends CheckoutQuoteDto {
  @ApiPropertyOptional({ example: 'Gọi trước khi giao hàng' })
  @IsOptional()
  @IsString()
  notes?: string;
}
