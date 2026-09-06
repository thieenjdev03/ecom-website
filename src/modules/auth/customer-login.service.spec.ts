import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

describe('Customer login and registration', () => {
  const user = { id: 'u1', email: 'buyer@example.com', phoneNumber: '84909090909', passwordHash: 'hash', role: 'user' };
  let users: any;
  let query: any;
  let service: AuthService;
  beforeEach(() => {
    query = { addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(user) };
    users = { createQueryBuilder: jest.fn(() => query), findOne: jest.fn().mockResolvedValue(null), create: jest.fn(value => value), save: jest.fn(async value => ({ id: 'new-user', ...value })) };
    service = new AuthService(users, { signAsync: jest.fn().mockResolvedValue('access-token') } as any, { sendWelcomeEmail: jest.fn().mockResolvedValue(undefined) } as any, { handleUserRegistration: jest.fn().mockResolvedValue(undefined) } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
  });
  it('logs in by normalized email and password in one request', async () => {
    await expect(service.login({ email: ' Buyer@Example.com ', password: 'password123' })).resolves.toHaveProperty('accessToken');
    expect(query.where).toHaveBeenCalledWith('user.email = :email', { email: 'buyer@example.com' });
  });
  it.each(['0909090909', '+84909090909'])('logs in by phone %s and password', async phone => {
    await expect(service.login({ phone, password: 'password123' })).resolves.toHaveProperty('accessToken');
    expect(query.where).toHaveBeenCalledWith('user.phoneNumber = :phone', { phone: '84909090909' });
  });
  it('rejects incorrect passwords', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login({ email: user.email, password: 'wrong-password' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('registers a new user without claiming or attaching guest orders', async () => {
    const result = await service.register('Buyer@Example.com', 'password123', 'Buyer', 'Name', '0909090909', 'Vietnam');
    expect(result.id).toBe('new-user');
    expect(users.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'buyer@example.com', phoneNumber: '84909090909', passwordHash: 'new-hash' }));
    expect(users.createQueryBuilder).not.toHaveBeenCalled();
  });
});
