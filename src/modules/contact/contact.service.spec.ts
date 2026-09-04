import { ContactService } from './contact.service';
import type { CreateContactDto } from './dto/create-contact.dto';

const dto = {
  fullName: 'Khách',
  email: 'Khach@Test.vn',
  phone: '0900000000',
  department: 'business',
  subject: 'Hợp tác',
  message: 'Xin chào',
} as CreateContactDto;

describe('ContactService', () => {
  const repo = { create: (row: unknown) => row, save: jest.fn(async (row) => ({ ...(row as object), id: 1 })) };

  beforeEach(() => {
    process.env.CONTACT_INBOX_EMAIL = 'inbox@test.vn';
    repo.save.mockClear();
  });

  it('trả về ngay cả khi SMTP treo (không để proxy timeout thành 502)', async () => {
    // Mail không bao giờ resolve — đúng cảnh cổng SMTP bị chặn trên PaaS.
    const mail = { sendEmail: jest.fn(() => new Promise<void>(() => {})) };
    const service = new ContactService(repo as never, mail as never);

    const saved = await Promise.race([
      service.submit(dto, '1.2.3.4'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('submit bị chặn bởi mail')), 500)),
    ]);

    expect((saved as { email: string }).email).toBe('khach@test.vn');
    expect(mail.sendEmail).toHaveBeenCalled();
  });

  it('chặn khi vượt 5 liên hệ / IP / giờ', async () => {
    const mail = { sendEmail: jest.fn(async () => undefined) };
    const service = new ContactService(repo as never, mail as never);
    for (let i = 0; i < 5; i += 1) await service.submit(dto, '9.9.9.9');
    await expect(service.submit(dto, '9.9.9.9')).rejects.toThrow(/quá nhiều/);
  });
});
