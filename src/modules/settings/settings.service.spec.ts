import { SettingsService } from './settings.service';
import type { SiteSetting } from './entities/site-setting.entity';

/** Repo giả tối thiểu: đủ cho find/upsert/delete mà service dùng. */
function fakeRepo(rows: SiteSetting[] = []) {
  return {
    rows,
    find: jest.fn(async () => rows),
    upsert: jest.fn(async ({ key, value }: { key: string; value: string }) => {
      const existing = rows.find((row) => row.key === key);
      if (existing) existing.value = value;
      else rows.push({ key, value, updated_at: new Date() } as SiteSetting);
    }),
    delete: jest.fn(async ({ key }: { key: string }) => {
      const index = rows.findIndex((row) => row.key === key);
      if (index >= 0) rows.splice(index, 1);
    }),
  };
}

describe('SettingsService', () => {
  it('khoá chưa có row trả về null', async () => {
    const repo = fakeRepo();
    const service = new SettingsService(repo as never);
    expect(await service.findAll()).toEqual({ partnership_pdf_url: null });
  });

  it('lưu link, bỏ qua khoá không gửi lên, và chuỗi rỗng thì xoá', async () => {
    const repo = fakeRepo();
    const service = new SettingsService(repo as never);

    await service.update({ partnership_pdf_url: 'https://a.test/deck.pdf' });
    expect(await service.findAll()).toEqual({ partnership_pdf_url: 'https://a.test/deck.pdf' });

    // Không gửi khoá nào -> giữ nguyên giá trị cũ.
    await service.update({});
    expect((await service.findAll()).partnership_pdf_url).toBe('https://a.test/deck.pdf');

    await service.update({ partnership_pdf_url: '' });
    expect((await service.findAll()).partnership_pdf_url).toBeNull();
    expect(repo.delete).toHaveBeenCalledWith({ key: 'partnership_pdf_url' });
  });
});
