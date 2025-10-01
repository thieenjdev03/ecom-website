import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPhoneNumber } from './entities/user-phone-number.entity';
import { CreatePhoneNumberDto, UpdatePhoneNumberDto } from './dto/phone-number.dto';

@Injectable()
export class UserPhoneService {
  constructor(
    @InjectRepository(UserPhoneNumber)
    private readonly phoneRepo: Repository<UserPhoneNumber>,
  ) {}

  async findAllByUser(userId: string): Promise<UserPhoneNumber[]> {
    return this.phoneRepo.find({
      where: { userId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async create(userId: string, dto: CreatePhoneNumberDto): Promise<UserPhoneNumber> {
    // Check if phone already exists for this user
    const existing = await this.phoneRepo.findOne({
      where: { userId, phoneNumber: dto.phoneNumber },
    });

    if (existing) {
      throw new ConflictException('Phone number already exists for this user');
    }

    // If setting as primary, unset other primary phones
    if (dto.isPrimary) {
      await this.phoneRepo.update({ userId, isPrimary: true }, { isPrimary: false });
    }

    const phone = this.phoneRepo.create({
      userId,
      ...dto,
    });

    return this.phoneRepo.save(phone);
  }

  async update(userId: string, phoneId: string, dto: UpdatePhoneNumberDto): Promise<UserPhoneNumber> {
    const phone = await this.phoneRepo.findOne({
      where: { id: phoneId, userId },
    });

    if (!phone) {
      throw new NotFoundException('Phone number not found');
    }

    // If setting as primary, unset other primary phones
    if (dto.isPrimary && !phone.isPrimary) {
      await this.phoneRepo.update({ userId, isPrimary: true }, { isPrimary: false });
    }

    Object.assign(phone, dto);
    return this.phoneRepo.save(phone);
  }

  async delete(userId: string, phoneId: string): Promise<void> {
    const phone = await this.phoneRepo.findOne({
      where: { id: phoneId, userId },
    });

    if (!phone) {
      throw new NotFoundException('Phone number not found');
    }

    await this.phoneRepo.remove(phone);
  }

  async setPrimary(userId: string, phoneId: string): Promise<UserPhoneNumber> {
    const phone = await this.phoneRepo.findOne({
      where: { id: phoneId, userId },
    });

    if (!phone) {
      throw new NotFoundException('Phone number not found');
    }

    // Unset all other primary phones
    await this.phoneRepo.update({ userId, isPrimary: true }, { isPrimary: false });

    phone.isPrimary = true;
    return this.phoneRepo.save(phone);
  }
}

