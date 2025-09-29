// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Role } from './role.enum';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async register(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.usersRepo.create({ 
      email, 
      password: password, // Keep original password for compatibility
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
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
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
    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.refreshTokenHash')
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException();
    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException();
    return this.issueTokens(user);
  }

  async logout(userId: number) {
    await this.usersRepo.update(userId, { refreshTokenHash: null });
    return { ok: true };
  }
}