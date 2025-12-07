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
        subject: 'Welcome to our Newsletter! 🎉',
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
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to our Newsletter</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7f7f7; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
          <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);">
            
            <!-- Header -->
            <div style="padding: 32px 28px 0; text-align: center;">
              <span style="display: inline-block; font-size: 28px; letter-spacing: 6px; font-weight: 600; color: #1f1f1f;">
                LUMÉ
              </span>
            </div>
            <div style="margin-top: 24px; height: 1px; background-color: #f0f0f0;"></div>
            
            <!-- Content -->
            <div style="padding: 32px 28px;">
              <p style="font-size: 14px; letter-spacing: 4px; color: #a07a62; text-transform: uppercase; margin: 0 0 12px; text-align: center;">
                WELCOME TO OUR NEWSLETTER!
              </p>
              <h1 style="font-size: 26px; margin: 0 0 20px; color: #3d332c; text-align: center;">
                Thank you for subscribing! 🎉
              </h1>
              
              <p style="margin: 0 0 16px;">
                Hi there,
              </p>
              
              <p style="margin: 0 0 16px;">
                We're thrilled to have you join our community! You've successfully subscribed to our newsletter at <strong>${email}</strong>.
              </p>
              
              <p style="margin: 0 0 24px;">
                From now on, you'll be the first to know about:
              </p>
              
              <ul style="margin: 0 0 24px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">✨ New product launches and exclusive collections</li>
                <li style="margin-bottom: 8px;">🎁 Special offers and promotions</li>
                <li style="margin-bottom: 8px;">📰 Fashion trends and style tips</li>
                <li style="margin-bottom: 8px;">🎯 Personalized recommendations just for you</li>
              </ul>
              
              <p style="margin: 0 0 24px;">
                Stay tuned for exciting updates delivered straight to your inbox!
              </p>
              
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${process.env.FRONTEND_URL || 'https://ecom-client-sable.vercel.app'}" 
                   style="display: inline-block; padding: 14px 40px; background-color: #c8a585; color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 600;">
                  Start Shopping
                </a>
              </div>
              
              <p style="margin: 0; color: #7a6a5a; font-size: 13px; text-align: center;">
                You can unsubscribe at any time from the links in our emails.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 8px; height: 1px; background-color: #f0f0f0;"></div>
            <div style="text-align: center; padding: 24px 16px 32px;">
              <p style="margin: 0 0 8px; color: #9a8c82; font-size: 13px;">
                &copy; ${new Date().getFullYear()} LUMÉ
              </p>
              <p style="margin: 0 0 12px; color: #b0a397; font-size: 12px;">
                Need help? Contact us at <a href="mailto:support@lume.com" style="color: #9a8c82; text-decoration: none;">support@lume.com</a>
              </p>
            </div>
            
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

