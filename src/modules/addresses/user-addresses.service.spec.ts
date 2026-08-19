import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserAddressesService } from './user-addresses.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';

/**
 * In-memory fake backing both the injected repository and the transactional
 * EntityManager. Implements only the subset of TypeORM the service uses, and
 * treats any `deletedAt` key in a where-clause as "must be null" (the service
 * only ever passes IsNull() there).
 */
class FakeStore {
  rows: any[] = [];
  private seq = 0;

  private matches(row: any, where: any): boolean {
    return Object.keys(where).every((key) => {
      if (key === 'deletedAt') return row.deletedAt == null;
      return row[key] === where[key];
    });
  }

  private sort(rows: any[], order?: Record<string, 'ASC' | 'DESC'>): any[] {
    if (!order) return rows;
    const entries = Object.entries(order);
    return [...rows].sort((a, b) => {
      for (const [key, dir] of entries) {
        const av = a[key];
        const bv = b[key];
        let cmp = 0;
        if (av instanceof Date || bv instanceof Date) {
          cmp = new Date(av).getTime() - new Date(bv).getTime();
        } else if (typeof av === 'boolean' || typeof bv === 'boolean') {
          cmp = (av ? 1 : 0) - (bv ? 1 : 0);
        } else {
          cmp = av > bv ? 1 : av < bv ? -1 : 0;
        }
        if (cmp !== 0) return dir === 'DESC' ? -cmp : cmp;
      }
      return 0;
    });
  }

  find(_e: any, opts: any = {}) {
    const matched = this.rows.filter((r) => this.matches(r, opts.where ?? {}));
    return Promise.resolve(this.sort(matched, opts.order));
  }

  findOne(_e: any, opts: any = {}) {
    const matched = this.sort(
      this.rows.filter((r) => this.matches(r, opts.where ?? {})),
      opts.order,
    );
    return Promise.resolve(matched[0] ?? null);
  }

  count(_e: any, opts: any = {}) {
    return Promise.resolve(this.rows.filter((r) => this.matches(r, opts.where ?? {})).length);
  }

  create(_e: any, data: any) {
    return { ...data };
  }

  save(_e: any, entity: any) {
    if (entity.id) {
      const idx = this.rows.findIndex((r) => r.id === entity.id);
      if (idx >= 0) {
        this.rows[idx] = { ...this.rows[idx], ...entity, updatedAt: entity.updatedAt ?? new Date() };
        return Promise.resolve(this.rows[idx]);
      }
    }
    const now = new Date();
    const saved = {
      ...entity,
      id: entity.id ?? `addr-${++this.seq}`,
      createdAt: entity.createdAt ?? now,
      updatedAt: entity.updatedAt ?? now,
      deletedAt: entity.deletedAt ?? null,
    };
    this.rows.push(saved);
    return Promise.resolve(saved);
  }

  update(_e: any, criteria: any, partial: any) {
    this.rows
      .filter((r) => this.matches(r, criteria))
      .forEach((r) => Object.assign(r, partial));
    return Promise.resolve({ affected: 1 });
  }

  softDelete(_e: any, id: string) {
    const row = this.rows.find((r) => r.id === id);
    if (row) row.deletedAt = new Date();
    return Promise.resolve({ affected: row ? 1 : 0 });
  }
}

function makeService() {
  const store = new FakeStore();
  const repo: any = {
    find: (opts: any) => store.find(null, opts),
    findOne: (opts: any) => store.findOne(null, opts),
  };
  const dataSource: any = {
    transaction: (cb: any) => Promise.resolve().then(() => cb(store)),
  };
  const service = new UserAddressesService(repo, dataSource);
  return { service, store };
}

const dto = (over: Partial<CreateUserAddressDto> = {}): CreateUserAddressDto => ({
  recipientName: 'Nguyễn Văn A',
  recipientPhone: '0901234567',
  provinceId: '79',
  provinceName: 'Thành phố Hồ Chí Minh',
  wardId: '26743',
  wardName: 'Phường Tân Thuận',
  district: 'Quận 7',
  addressLine: '123 Nguyễn Thị Thập',
  label: 'Nhà riêng',
  ...over,
});

const USER = 'user-1';

describe('UserAddressesService', () => {
  it('first created address becomes default automatically', async () => {
    const { service } = makeService();
    const a = await service.create(USER, dto({ isDefault: false }));
    expect(a.isDefault).toBe(true);
  });

  it('creating the same payload twice returns the same row (idempotent)', async () => {
    const { service, store } = makeService();
    const a = await service.create(USER, dto());
    const b = await service.create(USER, dto({ addressLine: '  123   nguyễn thị thập ' }));
    expect(b.id).toBe(a.id);
    expect(store.rows.filter((r) => r.deletedAt == null)).toHaveLength(1);
  });

  it('create with isDefault=true (not first) moves the default', async () => {
    const { service, store } = makeService();
    const a = await service.create(USER, dto());
    const b = await service.create(USER, dto({ addressLine: '456 Đường B', isDefault: true }));
    const rows = store.rows;
    expect(rows.find((r) => r.id === a.id).isDefault).toBe(false);
    expect(rows.find((r) => r.id === b.id).isDefault).toBe(true);
    expect(rows.filter((r) => r.isDefault && r.deletedAt == null)).toHaveLength(1);
  });

  it('rejects creating beyond the 20-address limit', async () => {
    const { service } = makeService();
    for (let i = 0; i < 20; i++) {
      await service.create(USER, dto({ addressLine: `line ${i}` }));
    }
    await expect(service.create(USER, dto({ addressLine: 'line 21' }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('setDefault leaves exactly one default among many', async () => {
    const { service, store } = makeService();
    await service.create(USER, dto({ addressLine: 'A' }));
    await service.create(USER, dto({ addressLine: 'B' }));
    const c = await service.create(USER, dto({ addressLine: 'C' }));
    await service.setDefault(USER, c.id);
    const active = store.rows.filter((r) => r.deletedAt == null);
    expect(active.filter((r) => r.isDefault)).toHaveLength(1);
    expect(store.rows.find((r) => r.id === c.id).isDefault).toBe(true);
  });

  it('removing the default promotes the most recently updated remaining address', async () => {
    const { service, store } = makeService();
    const a = await service.create(USER, dto({ addressLine: 'A' })); // default
    const b = await service.create(USER, dto({ addressLine: 'B' }));
    const c = await service.create(USER, dto({ addressLine: 'C' }));
    // make B most recent
    store.rows.find((r) => r.id === b.id).updatedAt = new Date(Date.now() + 10_000);
    await service.remove(USER, a.id);
    expect(store.rows.find((r) => r.id === a.id).deletedAt).not.toBeNull();
    expect(store.rows.find((r) => r.id === b.id).isDefault).toBe(true);
    expect(store.rows.find((r) => r.id === c.id).isDefault).toBe(false);
  });

  it('removing the last address does not throw', async () => {
    const { service, store } = makeService();
    const a = await service.create(USER, dto());
    await expect(service.remove(USER, a.id)).resolves.toBeUndefined();
    expect(store.rows.filter((r) => r.deletedAt == null)).toHaveLength(0);
  });

  it('update to an existing address key raises Conflict', async () => {
    const { service } = makeService();
    await service.create(USER, dto({ addressLine: 'A' }));
    const b = await service.create(USER, dto({ addressLine: 'B' }));
    await expect(service.update(USER, b.id, { addressLine: 'A' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('update can recompute key and set default', async () => {
    const { service, store } = makeService();
    await service.create(USER, dto({ addressLine: 'A' })); // default
    const b = await service.create(USER, dto({ addressLine: 'B' }));
    const updated = await service.update(USER, b.id, { addressLine: 'B2', isDefault: true });
    expect(updated.isDefault).toBe(true);
    expect(store.rows.filter((r) => r.isDefault && r.deletedAt == null)).toHaveLength(1);
  });

  it('findOneOrFail throws NotFound for another user / missing id', async () => {
    const { service } = makeService();
    const a = await service.create(USER, dto());
    await expect(service.findOneOrFail('other-user', a.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findAllByUser returns default first', async () => {
    const { service } = makeService();
    await service.create(USER, dto({ addressLine: 'A' }));
    const b = await service.create(USER, dto({ addressLine: 'B', isDefault: true }));
    const list = await service.findAllByUser(USER);
    expect(list[0].id).toBe(b.id);
    expect(list).toHaveLength(2);
  });

  describe('upsertFromCheckout', () => {
    it('saves a new address and never changes an existing default', async () => {
      const { service, store } = makeService();
      const first = await service.create(USER, dto({ addressLine: 'A' })); // default
      const saved = await service.upsertFromCheckout(USER, dto({ addressLine: 'B' }));
      expect(saved).not.toBeNull();
      expect(store.rows.find((r) => r.id === first.id).isDefault).toBe(true);
      expect(store.rows.find((r) => r.id === saved!.id).isDefault).toBe(false);
    });

    it('first-ever address from checkout becomes default', async () => {
      const { service } = makeService();
      const saved = await service.upsertFromCheckout(USER, dto());
      expect(saved!.isDefault).toBe(true);
    });

    it('is idempotent on repeat checkout with same address', async () => {
      const { service, store } = makeService();
      const a = await service.upsertFromCheckout(USER, dto());
      const b = await service.upsertFromCheckout(USER, dto());
      expect(b!.id).toBe(a!.id);
      expect(store.rows.filter((r) => r.deletedAt == null)).toHaveLength(1);
    });

    it('returns null (no throw) when at the address limit', async () => {
      const { service } = makeService();
      for (let i = 0; i < 20; i++) {
        await service.create(USER, dto({ addressLine: `line ${i}` }));
      }
      const saved = await service.upsertFromCheckout(USER, dto({ addressLine: 'overflow' }));
      expect(saved).toBeNull();
    });

    it('never throws even if the transaction blows up', async () => {
      const repo: any = { find: jest.fn(), findOne: jest.fn() };
      const dataSource: any = {
        transaction: () => Promise.reject(new Error('db exploded')),
      };
      const service = new UserAddressesService(repo, dataSource);
      await expect(service.upsertFromCheckout(USER, dto())).resolves.toBeNull();
    });
  });
});
