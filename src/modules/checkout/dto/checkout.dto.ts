import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutShippingAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  recipient_name: string;

  @ApiProperty({ example: '0901234567' })
  @Matches(/^(?:0|\+84)\d{9,10}$/)
  recipient_phone: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Hồ Chí Minh' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional({ example: 'Phường Bến Nghé' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ example: '1 Nguyễn Huệ' })
  @IsString()
  @IsNotEmpty()
  street_line_1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street_line_2?: string;
}

export class CheckoutQuoteDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Saved address for an authenticated customer' })
  @IsOptional()
  @IsUUID()
  shipping_address_id?: string;

  @ApiPropertyOptional({ type: CheckoutShippingAddressDto, description: 'Inline address for guest checkout' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutShippingAddressDto)
  shipping_address?: CheckoutShippingAddressDto;

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
