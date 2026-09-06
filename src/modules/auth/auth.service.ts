import {
  BadRequestException,
  ConflictException,
  Injectable,
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
    email = email.trim().toLowerCase();
    phoneNumber = normalizeVnPhone(phoneNumber);
    if (!phoneNumber) throw new BadRequestException('Số điện thoại không hợp lệ.');
    const [emailUser, phoneUser] = await this.registrationMatches({ email, phone: phoneNumber });
    if (emailUser || phoneUser) {
      throw new ConflictException(emailUser && phoneUser
        ? 'Email và số điện thoại đã được đăng ký.'
        : emailUser ? 'Email đã được đăng ký.' : 'Số điện thoại đã được đăng ký.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      role: Role.USER,
      firstName,
      lastName,
      // Registration and phone login share the same canonical form.
      phoneNumber: phoneNumber ? normalizeVnPhone(phoneNumber) : phoneNumber,
      country,
    });
    let saved: User;
    try {
      saved = await this.usersRepository.save(user);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('Email hoặc số điện thoại đã được đăng ký.');
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

  private async registrationMatches(input: { phone?: string; email?: string }) {
    const email = input.email?.trim().toLowerCase();
    const phone = input.phone ? normalizeVnPhone(input.phone) : undefined;
    if (!email && !phone) throw new BadRequestException('Provide a phone or email to look up the account.');
    const digits = `regexp_replace("user"."phoneNumber", '[^0-9]', '', 'g')`;
    const normalizedPhone = `CASE WHEN ${digits} LIKE '0%' THEN '84' || substring(${digits} from 2) ELSE ${digits} END`;
    return Promise.all([
      email ? this.usersRepository.createQueryBuilder('user').addSelect('user.passwordHash')
        .where('lower(trim("user"."email")) = :email', { email }).getOne() : null,
      phone ? this.usersRepository.createQueryBuilder('user').addSelect('user.passwordHash')
        .where(`${normalizedPhone} = :phone`, { phone }).getOne() : null,
    ]);
  }

  /** Registration checks both identifiers independently; either collision blocks registration. */
  async checkExists(input: { phone?: string; email?: string }): Promise<{ exists: boolean; hasPassword: boolean }> {
    const users = await this.registrationMatches(input);
    return { exists: users.some(Boolean), hasPassword: users.some(user => !!user?.passwordHash) };
  }

  /** Legacy claiming is disabled; guest purchases do not create accounts. */
  async setPassword(input: {
    phone?: string;
    email?: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    throw new BadRequestException('Please register a new account or use password reset.');
  }
}
