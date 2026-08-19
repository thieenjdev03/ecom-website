import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload for the user address book (sổ địa chỉ). Field names follow the spec's
 * API contract; the service maps them onto the reused `addresses` columns
 * (provinceName→province, wardName→ward, addressLine→streetLine1).
 */
export class CreateUserAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A', maxLength: 160 })
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận là bắt buộc' })
  @MaxLength(160)
  recipientName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ' })
  recipientPhone: string;

  @ApiProperty({ example: '79' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn Tỉnh/Thành phố' })
  @MaxLength(20)
  provinceId: string;

  @ApiProperty({ example: 'Thành phố Hồ Chí Minh', maxLength: 160 })
  @IsString()
  @IsNotEmpty({ message: 'Tên Tỉnh/Thành phố là bắt buộc' })
  @MaxLength(160)
  provinceName: string;

  @ApiProperty({ example: '26743' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn Phường/Xã' })
  @MaxLength(20)
  wardId: string;

  @ApiProperty({ example: 'Phường Tân Thuận', maxLength: 160 })
  @IsString()
  @IsNotEmpty({ message: 'Tên Phường/Xã là bắt buộc' })
  @MaxLength(160)
  wardName: string;

  @ApiPropertyOptional({ example: 'Quận 7', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  district?: string;

  @ApiProperty({ example: '123 Nguyễn Thị Thập', maxLength: 255 })
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ chi tiết là bắt buộc' })
  @MaxLength(255)
  addressLine: string;

  @ApiPropertyOptional({ example: 'Nhà riêng', maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @ApiPropertyOptional({ default: false, description: 'Đặt làm địa chỉ mặc định' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
