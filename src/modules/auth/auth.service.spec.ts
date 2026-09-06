import { BadRequestException } from '@nestjs/common';
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
            sendWelcomeEmail: jest.fn(),
          },
        },
        {
          provide: MarketingService,
          useValue: {
            handleUserRegistration: jest.fn(),
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

  it('does not claim guest accounts by knowing a phone number', async () => {
    await expect(service.setPassword({ phone: '0909090909', password: 'newpassword123' })).rejects.toBeInstanceOf(BadRequestException);
    expect(save).not.toHaveBeenCalled();
  });
});
