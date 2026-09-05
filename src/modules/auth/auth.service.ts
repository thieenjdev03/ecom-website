import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Role } from '../../auth/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { MarketingService } from '../marketing/marketing.service';
import { normalizeVnPhone } from '../../common/phone.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly marketingService: MarketingService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    country: string,
    marketingOptIn = true,
  ) {
    const exists = await this.usersRepository.findOne({ where: { email } });
    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      role: Role.USER,
      firstName,
      lastName,
      // Normalized so a later guest checkout under the same number (see
      // CheckoutService.findOrCreateGuestByPhone) resolves to this account
      // instead of spawning a duplicate guest.
      phoneNumber: phoneNumber ? normalizeVnPhone(phoneNumber) : phoneNumber,
      country,
    });
    let saved: User;
    try {
      saved = await this.usersRepository.save(user);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('This phone number is already registered to another account.');
      }
      throw error;
    }

    // Send welcome email asynchronously; failure should not block registration flow
    // Note: Errors are caught and logged inside MailService, but we also guard here
    const displayName = saved.firstName && saved.lastName
      ? `${saved.firstName} ${saved.lastName}`
      : saved.firstName || saved.lastName || saved.email;
    this.mailService
      .sendWelcomeEmail(saved.email, displayName)
      .catch(() => {
        // Intentionally swallow errors to avoid impacting the registration response
      });

    this.marketingService
      .handleUserRegistration({
        email: saved.email,
        userId: saved.id,
        marketingOptIn,
      })
      .catch(() => {
        // Ignore marketing sync failures to avoid blocking registration
      });

    return { id: saved.id, email: saved.email, role: saved.role };
  }

  /**
   * Accepts either identifier: customers who arrived through guest checkout are
   * keyed by phone and may have no email at all, so email-only login would lock
   * them out of the account their orders live in.
   */
  async login(input: { email?: string; phone?: string; password: string }) {
    // findByIdentifiers opts into passwordHash (select:false on the entity).
    const user = await this.findByIdentifiers(input);
    if (!user || !user.passwordHash) {
      // No passwordHash: either no such account, or a guest account created
      // from checkout that hasn't set a password yet (see /auth/set-password).
      throw new UnauthorizedException('Sai thông tin tài khoản hoặc mật khẩu vui lòng thử lại');
    }
    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Sai thông tin tài khoản hoặc mật khẩu vui lòng thử lại');
    }

    return this.issueLoginResponse(user);
  }

  /**
   * Look up an account by phone (primary identifier — matches guest checkout,
   * see CheckoutService.findOrCreateGuestByPhone) or, failing that, email.
   * Loads passwordHash so callers can tell a real account from an unclaimed
   * guest one.
   */
  private async findByIdentifiers(input: { phone?: string; email?: string }): Promise<User | null> {
    const phone = input.phone ? normalizeVnPhone(input.phone) : undefined;
    const email = input.email?.trim().toLowerCase();
    if (!phone && !email) {
      throw new BadRequestException('Provide a phone or email to look up the account.');
    }

    const qb = this.usersRepository.createQueryBuilder('user').addSelect('user.passwordHash');
    if (phone) {
      qb.where('user.phoneNumber = :phone', { phone });
    } else {
      qb.where('user.email = :email', { email });
    }
    return qb.getOne();
  }

  private async issueLoginResponse(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  /** Used by the storefront's "Đăng ký" step to decide: register vs. set a password on an existing guest. */
  async checkExists(input: { phone?: string; email?: string }): Promise<{ exists: boolean; hasPassword: boolean }> {
    const user = await this.findByIdentifiers(input);
    return { exists: !!user, hasPassword: !!user?.passwordHash };
  }

  /**
   * Claims a passwordless guest account (created from a guest checkout) by
   * setting its first password — no OTP, by explicit product decision:
   * whoever knows the phone/email an order was placed under can claim it.
   * Logs the caller in immediately on success.
   */
  async setPassword(input: {
    phone?: string;
    email?: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const user = await this.findByIdentifiers(input);
    if (!user) {
      throw new NotFoundException('No account found for this phone/email.');
    }
    if (user.passwordHash) {
      throw new ConflictException('This account already has a password. Please log in instead.');
    }

    user.passwordHash = await bcrypt.hash(input.password, 12);
    user.isGuest = false;
    if (input.email && !user.email) user.email = input.email.trim().toLowerCase();
    if (input.firstName && !user.firstName) user.firstName = input.firstName;
    if (input.lastName && !user.lastName) user.lastName = input.lastName;

    let saved: User;
    try {
      saved = await this.usersRepository.save(user);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('This email is already used by another account.');
      }
      throw error;
    }

    return this.issueLoginResponse(saved);
  }
}
