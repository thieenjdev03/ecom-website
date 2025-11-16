import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Role } from '../../auth/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(email: string, password: string, firstName: string, lastName: string, phoneNumber: string, country: string) {
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
      phoneNumber,
      country,
    });
    const saved = await this.usersRepository.save(user);

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

    return { id: saved.id, email: saved.email, role: saved.role };
  }

  async login(email: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
