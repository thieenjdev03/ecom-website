import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingContact, MarketingSource } from './entities/marketing-contact.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import { RegisterMarketingContactDto } from './dto/register-contact.dto';
import { MailService } from '../mail/mail.service';
import {
  renderMingoEmail,
  mingoButton,
  mingoBrandFromEnv,
  MINGO,
  MINGO_FONT,
  escapeHtml,
} from '../../common/email/mingo-email';

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    @InjectRepository(MarketingContact)
    private readonly marketingRepository: Repository<MarketingContact>,
    private readonly mailService: MailService,
  ) {}

  async subscribe(subscribeDto: SubscribeDto): Promise<MarketingContact> {
    const normalizedEmail = this.normalizeEmail(subscribeDto.email);
    const source: MarketingSource = subscribeDto.source ?? 'modal';

    const existing = await this.marketingRepository.findOne({
      where: { email: normalizedEmail },
    });

    let isNewSubscription = false;

    if (!existing) {
      const contact = this.marketingRepository.create({
        email: normalizedEmail,
        subscribed: true,
        source,
        tags: [],
      });
      const savedContact = await this.marketingRepository.save(contact);
      isNewSubscription = true;

      // Send welcome email for new subscription
      await this.sendSubscriptionWelcomeEmail(normalizedEmail);

      return savedContact;
    }

    // If user was previously unsubscribed and now subscribing again
    const wasUnsubscribed = !existing.subscribed;
    existing.subscribed = true;
    existing.unsubscribedAt = null;
    existing.source = source;

    const savedContact = await this.marketingRepository.save(existing);

    // Send welcome email if re-subscribing
    if (wasUnsubscribed) {
      await this.sendSubscriptionWelcomeEmail(normalizedEmail);
    }

    return savedContact;
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

  /**
   * Send welcome email to new newsletter subscriber
   * @param email - Subscriber email
   */
  private async sendSubscriptionWelcomeEmail(email: string): Promise<void> {
    try {
      await this.mailService.sendEmail({
        to: email,
        subject: 'Chào mừng bạn đến với Mingo!',
        html: this.generateNewsletterWelcomeHTML(email),
      });
      this.logger.log(`Newsletter welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send newsletter welcome email to ${email}:`, error);
      // Don't throw error - subscription should succeed even if email fails
    }
  }

  /**
   * Generate newsletter welcome email HTML
   * @param email - Subscriber email
   */
  private generateNewsletterWelcomeHTML(email: string): string {
    const brand = mingoBrandFromEnv();
    const li = (text: string) =>
      `<li style="margin-bottom:10px;">${text}</li>`;

    const content = `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;text-align:center;">
        Đăng ký nhận tin thành công
      </p>
      <h1 style="margin:0 0 18px;font-family:${MINGO_FONT};font-size:26px;font-weight:800;color:${MINGO.brown};text-align:center;">
        Chào mừng bạn đến với Mingo!
      </h1>

      <p style="margin:0 0 16px;">Xin chào,</p>
      <p style="margin:0 0 16px;">
        Rất vui được chào đón bạn! Bạn đã đăng ký nhận bản tin của Mingo bằng địa chỉ
        <strong>${escapeHtml(email)}</strong>.
      </p>
      <p style="margin:0 0 12px;">Từ giờ, bạn sẽ là người đầu tiên biết về:</p>
      <ul style="margin:0 0 24px;padding-left:20px;color:${MINGO.brown};">
        ${li('✨ Vị kem mới &amp; bộ sưu tập giới hạn')}
        ${li('🎁 Ưu đãi và khuyến mãi độc quyền')}
        ${li('📣 Sự kiện, quà tặng dành riêng cho thành viên')}
        ${li('🎯 Gợi ý sản phẩm phù hợp với bạn')}
      </ul>

      <div style="text-align:center;margin:28px 0 24px;">
        ${mingoButton(brand.brandUrl, 'Khám phá cửa hàng')}
      </div>

      <p style="margin:0;color:${MINGO.muted};font-size:13px;text-align:center;">
        Bạn có thể hủy đăng ký bất cứ lúc nào qua liên kết trong email.
      </p>
    `;

    return renderMingoEmail(brand, {
      title: `Chào mừng đến với ${brand.brandName}`,
      preheader: 'Cảm ơn bạn đã đăng ký nhận tin từ Mingo!',
      content,
    });
  }
}
