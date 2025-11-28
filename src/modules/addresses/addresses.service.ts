import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Role } from '../../auth/enums/role.enum';

type JwtUser = { sub: string; email: string; role: Role };

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  async findByUserId(userId: string) {
    return this.addressRepo.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto, currentUser: JwtUser) {
    const address = await this.addressRepo.findOne({ where: { id: addressId, userId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const isOwner = currentUser.sub === address.userId;
    const isAdmin = currentUser.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('FORBIDDEN');
    }

    const trimmed = this.sanitizeDto(dto);

    if (trimmed.isDefault === true) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    await this.addressRepo.update(addressId, trimmed);
    const updated = await this.addressRepo.findOne({ where: { id: addressId } });
    return updated;
  }

  async upsertByUser(userId: string, dto: UpdateAddressDto) {
    const sanitized = this.sanitizeDto(dto);
    const payload: Partial<Address> = {
      ...sanitized,
      userId,
      isShipping: sanitized.isShipping ?? true,
      label: sanitized.label ?? 'Checkout',
    };

    if (payload.isDefault !== false) {
      await this.addressRepo.update({ userId }, { isDefault: false });
      payload.isDefault = true;
    }

    this.ensureRequiredFields(payload);

    const existing = await this.addressRepo.findOne({
      where: { userId, isDefault: true, isShipping: true },
    });

    if (existing) {
      await this.addressRepo.update(existing.id, payload);
      return this.addressRepo.findOne({ where: { id: existing.id } });
    }

    const created = this.addressRepo.create({
      recipientName: payload.recipientName,
      recipientPhone: payload.recipientPhone,
      countryCode: payload.countryCode,
      province: payload.province,
      district: payload.district,
      ward: payload.ward,
      streetLine1: payload.streetLine1,
      streetLine2: payload.streetLine2,
      postalCode: payload.postalCode,
      note: payload.note,
      label: payload.label,
      isShipping: payload.isShipping,
      isBilling: payload.isBilling ?? false,
      isDefault: payload.isDefault ?? true,
      latitude: payload.latitude,
      longitude: payload.longitude,
      userId,
    });

    return this.addressRepo.save(created);
  }

  private sanitizeDto(dto: UpdateAddressDto): Partial<UpdateAddressDto> {
    const trimmed: Partial<UpdateAddressDto> = {};
    for (const key of Object.keys(dto) as (keyof UpdateAddressDto)[]) {
      const value = dto[key];
      if (typeof value === 'string') {
        trimmed[key] = value.trim() as never;
      } else {
        trimmed[key] = value as never;
      }
    }
    return trimmed;
  }

  private ensureRequiredFields(payload: Partial<Address>) {
    const missing: string[] = [];
    if (!payload.recipientName) missing.push('recipientName');
    if (!payload.countryCode) missing.push('countryCode');
    if (!payload.province) missing.push('province');
    if (!payload.district) missing.push('district');
    if (!payload.streetLine1) missing.push('streetLine1');

    if (missing.length) {
      throw new BadRequestException(`Missing required address fields: ${missing.join(', ')}`);
    }
  }
}


