import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingContact, MarketingSource } from './entities/marketing-contact.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import { RegisterMarketingContactDto } from './dto/register-contact.dto';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingContact)
    private readonly marketingRepository: Repository<MarketingContact>,
  ) {}

  async subscribe(subscribeDto: SubscribeDto): Promise<MarketingContact> {
    const normalizedEmail = this.normalizeEmail(subscribeDto.email);
    const source: MarketingSource = subscribeDto.source ?? 'modal';

    const existing = await this.marketingRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!existing) {
      const contact = this.marketingRepository.create({
        email: normalizedEmail,
        subscribed: true,
        source,
        tags: [],
      });
      return this.marketingRepository.save(contact);
    }

    existing.subscribed = true;
    existing.unsubscribedAt = null;
    existing.source = source;

    return this.marketingRepository.save(existing);
  }

  async handleUserRegistration(dto: RegisterMarketingContactDto): Promise<MarketingContact> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const existing = await this.marketingRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!existing) {
      const contact = this.marketingRepository.create({
        email: normalizedEmail,
        userId: dto.userId,
        subscribed: dto.marketingOptIn,
        source: 'register',
        tags: dto.tags ?? [],
        unsubscribedAt: dto.marketingOptIn ? null : new Date(),
      });
      return this.marketingRepository.save(contact);
    }

    existing.userId = dto.userId;
    existing.subscribed = dto.marketingOptIn;
    existing.source = 'register';
    existing.tags = dto.tags ?? existing.tags ?? [];
    existing.unsubscribedAt = dto.marketingOptIn ? null : new Date();

    return this.marketingRepository.save(existing);
  }

  async unsubscribe(unsubscribeDto: UnsubscribeDto): Promise<void> {
    const normalizedEmail = this.normalizeEmail(unsubscribeDto.email);
    this.ensureTokenIsPresent(unsubscribeDto.token);

    const existing = await this.marketingRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!existing) {
      throw new NotFoundException('Email not found or already removed from marketing list');
    }

    existing.subscribed = false;
    existing.unsubscribedAt = new Date();

    await this.marketingRepository.save(existing);
  }

  private normalizeEmail(email: string): string {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return email.trim().toLowerCase();
  }

  private ensureTokenIsPresent(token: string) {
    if (!token?.trim()) {
      throw new UnauthorizedException('Invalid unsubscribe token');
    }
    // Token validation logic to be implemented when token generation is ready.
  }
}

