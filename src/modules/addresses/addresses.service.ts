import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

    // Trim string fields
    const trimmed: Partial<UpdateAddressDto> = {};
    for (const key of Object.keys(dto) as (keyof UpdateAddressDto)[]) {
      const value = dto[key];
      if (typeof value === 'string') {
        trimmed[key] = value.trim() as never;
      } else {
        trimmed[key] = value as never;
      }
    }

    // If set default, unset others
    if (trimmed.isDefault === true) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    await this.addressRepo.update(addressId, trimmed);
    const updated = await this.addressRepo.findOne({ where: { id: addressId } });
    return updated;
  }
}


