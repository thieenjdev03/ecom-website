import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { MarketingService } from '../marketing/marketing.service';

describe('AuthService', () => {
  let service: AuthService;
  let getOne: jest.Mock;
  let save: jest.Mock;

  beforeEach(async () => {
    getOne = jest.fn();
    save = jest.fn((user) => Promise.resolve(user));
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((data) => data),
            save,
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MarketingService,
          useValue: {
            handleUserRegistration: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkExists', () => {
    it('checks email even when a different, unused phone is supplied', async () => {
      getOne.mockResolvedValueOnce({ id: 'email-owner', passwordHash: 'hash' }).mockResolvedValueOnce(null);
      await expect(service.checkExists({ email: 'existing@example.com', phone: '0909090909' })).resolves.toEqual({ exists: true, hasPassword: true });
    });
    it('reports no account when nothing matches', async () => {
      getOne.mockResolvedValue(null);
      await expect(service.checkExists({ phone: '0909090909' })).resolves.toEqual({
        exists: false,
        hasPassword: false,
      });
    });

    it('reports a guest account (no password) as claimable', async () => {
      getOne.mockResolvedValue({ id: 'u1', passwordHash: null });
      await expect(service.checkExists({ phone: '0909090909' })).resolves.toEqual({
        exists: true,
        hasPassword: false,
      });
    });

    it('reports a real account (has password)', async () => {
      getOne.mockResolvedValue({ id: 'u1', passwordHash: 'hash' });
      await expect(service.checkExists({ email: 'a@b.com' })).resolves.toEqual({
        exists: true,
        hasPassword: true,
      });
    });
  });

  it.each([
    [{ id: 'email-owner' }, null],
    [null, { id: 'phone-owner' }],
    [{ id: 'email-owner' }, { id: 'different-phone-owner' }],
  ])('rejects registration when either identifier belongs to an account', async (emailUser, phoneUser) => {
    getOne.mockResolvedValueOnce(emailUser).mockResolvedValueOnce(phoneUser);
    await expect(service.register('Existing@Example.com', 'password123', 'A', 'B', '+84 909 090 909', 'VN')).rejects.toBeInstanceOf(ConflictException);
    expect(save).not.toHaveBeenCalled();
  });

  it('saves normalized identifiers for a new registration', async () => {
    getOne.mockResolvedValue(null);
    await service.register(' New@Example.com ', 'password123', 'A', 'B', '0909 090 909', 'VN');
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com', phoneNumber: '84909090909' }));
  });

  it('returns conflict if another request registers the identifier first', async () => {
    getOne.mockResolvedValue(null);
    save.mockRejectedValue({ code: '23505' });
    await expect(service.register('new@example.com', 'password123', 'A', 'B', '0909090909', 'VN')).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not claim guest accounts by knowing a phone number', async () => {
    await expect(service.setPassword({ phone: '0909090909', password: 'newpassword123' })).rejects.toBeInstanceOf(BadRequestException);
    expect(save).not.toHaveBeenCalled();
  });
});
