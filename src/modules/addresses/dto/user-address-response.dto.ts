import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Address } from '../address.entity';

/**
 * Public shape of a single address-book entry. Never exposes `userId`,
 * `dedupeKey` or `deletedAt`.
 */
export class UserAddressResponseDto {
  @ApiProperty({ example: 'b4b2b07f-6825-402b-bd2c-f9aef8cfbba5' })
  id: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  recipientName: string;

  @ApiProperty({ example: '0901234567' })
  recipientPhone: string;

  @ApiProperty({ example: '79' })
  provinceId: string;

  @ApiProperty({ example: 'Thành phố Hồ Chí Minh' })
  provinceName: string;

  @ApiProperty({ example: '26743' })
  wardId: string;

  @ApiProperty({ example: 'Phường Tân Thuận' })
  wardName: string;

  @ApiPropertyOptional({ example: 'Quận 7', nullable: true })
  district: string | null;

  @ApiProperty({ example: '123 Nguyễn Thị Thập' })
  addressLine: string;

  @ApiPropertyOptional({ example: 'Nhà riêng', nullable: true })
  label: string | null;

  @ApiProperty({ example: true })
  isDefault: boolean;

  @ApiProperty({
    example: '123 Nguyễn Thị Thập, Phường Tân Thuận, Thành phố Hồ Chí Minh',
    description: 'Địa chỉ đã ghép sẵn để FE hiển thị',
  })
  formattedAddress: string;

  @ApiProperty({ example: '2026-08-17T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-17T00:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(a: Address): UserAddressResponseDto {
    const dto = new UserAddressResponseDto();
    dto.id = a.id;
    dto.recipientName = a.recipientName;
    dto.recipientPhone = a.recipientPhone ?? '';
    dto.provinceId = a.provinceId ?? '';
    dto.provinceName = a.province ?? '';
    dto.wardId = a.wardId ?? '';
    dto.wardName = a.ward ?? '';
    dto.district = a.district && a.district.trim() !== '' ? a.district : null;
    dto.addressLine = a.streetLine1 ?? '';
    dto.label = a.label ?? null;
    dto.isDefault = a.isDefault;
    dto.formattedAddress = [dto.addressLine, dto.district, dto.wardName, dto.provinceName]
      .map((p) => (p ?? '').trim())
      .filter((p) => p !== '')
      .join(', ');
    dto.createdAt = a.createdAt;
    dto.updatedAt = a.updatedAt;
    return dto;
  }
}

export class UserAddressListResponseDto {
  @ApiProperty({ type: [UserAddressResponseDto] })
  items: UserAddressResponseDto[];

  @ApiProperty({ example: 3 })
  total: number;
}
