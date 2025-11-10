// src/auth/auth.service.ts
import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Role } from './enums/role.enum';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async register(email: string, password: string) {
    // Check if user already exists
    const existingUser = await this.usersRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email is already in use. Please use a different email or login.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.usersRepo.create({ 
      email, 
      passwordHash, 
      role: Role.USER 
    });
    await this.usersRepo.save(user);
    const tokens = await this.issueTokens(user);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password. Please check your credentials and try again.');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password. Please check your credentials and try again.');
    }
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const tokens = await this.issueTokens(user);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  async loginWithOtp(email: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Account not found with this email. Please check your email or register a new account.');
    }
    const tokens = await this.issueTokens(user);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  async issueTokens(user: User) {
    const payload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: ACCESS_TTL });
    const refreshToken = await this.jwt.signAsync(payload, { expiresIn: REFRESH_TTL });
    // Lưu RT băm
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.usersRepo.update(user.id, { refreshTokenHash });
    return { accessToken, refreshToken };
  }

  async refresh(userId: number, refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required. Please provide a valid refresh token.');
    }

    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.refreshTokenHash')
      .where('u.id = :id', { id: userId })
      .getOne();
    
    if (!user) {
      throw new UnauthorizedException('User not found. Please login again.');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token does not exist. Please login again to receive a new token.');
    }

    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid or expired refresh token. Please login again.');
    }

    return this.issueTokens(user);
  }

  async logout(userId: number) {
    await this.usersRepo.update(userId, { refreshTokenHash: null });
    return { ok: true };
  }
}