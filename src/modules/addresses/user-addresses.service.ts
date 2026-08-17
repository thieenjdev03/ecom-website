import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { buildAddressDedupeKey } from './utils/address-dedupe.util';

const MAX_ADDRESSES_PER_USER = 20;

@Injectable()
export class UserAddressesService {
  private readonly logger = new Logger(UserAddressesService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    private readonly dataSource: DataSource,
  ) {}

  /** List active addresses, default first then most recently updated. */
  async findAllByUser(userId: string): Promise<Address[]> {
    return this.addressRepo.find({
      where: { userId, deletedAt: IsNull() },
      order: { isDefault: 'DESC', updatedAt: 'DESC' },
    });
  }

  async findOneOrFail(userId: string, id: string): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }
    return address;
  }

  async create(userId: string, dto: CreateUserAddressDto): Promise<Address> {
    return this.dataSource.transaction(async (manager) => {
      const dedupeKey = this.dedupeKeyFor(dto);

      // Idempotent: reuse an existing identical address instead of duplicating.
      const existing = await manager.findOne(Address, {
        where: { userId, dedupeKey, deletedAt: IsNull() },
      });
      if (existing) {
        return this.reconcileExisting(manager, existing, dto);
      }

      const activeCount = await manager.count(Address, {
        where: { userId, deletedAt: IsNull() },
      });
      if (activeCount >= MAX_ADDRESSES_PER_USER) {
        throw new BadRequestException(
          `Bạn chỉ có thể lưu tối đa ${MAX_ADDRESSES_PER_USER} địa chỉ`,
        );
      }

      const isFirst = activeCount === 0;
      const wantsDefault = isFirst || dto.isDefault === true;

      const address = manager.create(Address, {
        ...this.toEntityFields(dto),
        userId,
        dedupeKey,
        countryCode: 'VN',
        isShipping: true,
        // Set default flag last via setDefault to keep the one-default invariant.
        isDefault: isFirst,
      });
      const saved = await manager.save(Address, address);

      if (wantsDefault && !isFirst) {
        await this.applyDefault(manager, userId, saved.id);
        saved.isDefault = true;
      }
      return saved;
    });
  }

  async update(userId: string, id: string, dto: UpdateUserAddressDto): Promise<Address> {
    return this.dataSource.transaction(async (manager) => {
      const address = await manager.findOne(Address, {
        where: { id, userId, deletedAt: IsNull() },
      });
      if (!address) {
        throw new NotFoundException('Không tìm thấy địa chỉ');
      }

      Object.assign(address, this.toEntityFields(dto));
      const newKey = this.dedupeKeyForEntity(address);

      if (newKey !== address.dedupeKey) {
        const clash = await manager.findOne(Address, {
          where: { userId, dedupeKey: newKey, deletedAt: IsNull() },
        });
        if (clash && clash.id !== id) {
          throw new ConflictException('Địa chỉ này đã tồn tại trong sổ địa chỉ');
        }
      }
      address.dedupeKey = newKey;

      const saved = await manager.save(Address, address);

      if (dto.isDefault === true && !saved.isDefault) {
        await this.applyDefault(manager, userId, saved.id);
        saved.isDefault = true;
      }
      return saved;
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const address = await manager.findOne(Address, {
        where: { id, userId, deletedAt: IsNull() },
      });
      if (!address) {
        throw new NotFoundException('Không tìm thấy địa chỉ');
      }

      await manager.softDelete(Address, id);

      if (address.isDefault) {
        // Promote the most recently updated remaining address, if any.
        const next = await manager.findOne(Address, {
          where: { userId, deletedAt: IsNull() },
          order: { updatedAt: 'DESC', createdAt: 'DESC' },
        });
        if (next) {
          await this.applyDefault(manager, userId, next.id);
        }
      }
    });
  }

  async setDefault(userId: string, id: string): Promise<Address> {
    return this.dataSource.transaction(async (manager) => {
      // Lock the user's addresses so two concurrent setDefault calls can't both
      // win and violate the partial unique "one default" index.
      const rows = await manager.find(Address, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      const target = rows.find((r) => r.id === id && !r.deletedAt);
      if (!target) {
        throw new NotFoundException('Không tìm thấy địa chỉ');
      }

      await this.applyDefault(manager, userId, id);
      target.isDefault = true;
      return target;
    });
  }

  /**
   * Save a manually-typed checkout address into the book. Never throws — a
   * failure here must not fail order creation. Does not change the user's
   * existing default. Returns the saved/existing address, or null on any issue.
   */
  async upsertFromCheckout(
    userId: string,
    dto: CreateUserAddressDto,
  ): Promise<Address | null> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const dedupeKey = this.dedupeKeyFor(dto);

        const existing = await manager.findOne(Address, {
          where: { userId, dedupeKey, deletedAt: IsNull() },
        });
        if (existing) {
          return this.reconcileExisting(manager, existing, dto);
        }

        const activeCount = await manager.count(Address, {
          where: { userId, deletedAt: IsNull() },
        });
        if (activeCount >= MAX_ADDRESSES_PER_USER) {
          this.logger.warn(
            `upsertFromCheckout: user ${userId} at address limit; skipping save`,
          );
          return null;
        }

        const address = manager.create(Address, {
          ...this.toEntityFields(dto),
          userId,
          dedupeKey,
          countryCode: 'VN',
          isShipping: true,
          // First address becomes default; otherwise leave the user's choice.
          isDefault: activeCount === 0,
        });
        return manager.save(Address, address);
      });
    } catch (err) {
      this.logger.warn(
        `upsertFromCheckout failed for user ${userId}: ${err?.message ?? err}`,
      );
      return null;
    }
  }

  // --- helpers ---

  /** Clear every default for the user, then set `id` as the sole default. */
  private async applyDefault(
    manager: EntityManager,
    userId: string,
    id: string,
  ): Promise<void> {
    // Order matters: clear all first, then set — otherwise the unique index is
    // momentarily violated.
    await manager.update(Address, { userId, isDefault: true }, { isDefault: false });
    await manager.update(Address, { id }, { isDefault: true });
  }

  /** On a dedupe hit, refresh district/label when the caller supplies new values. */
  private async reconcileExisting(
    manager: EntityManager,
    existing: Address,
    dto: CreateUserAddressDto | UpdateUserAddressDto,
  ): Promise<Address> {
    if (dto.district !== undefined && dto.district.trim() !== (existing.district ?? '')) {
      existing.district = dto.district.trim();
    }
    if (dto.label !== undefined && dto.label.trim() !== (existing.label ?? '')) {
      existing.label = dto.label.trim();
    }
    // Touch updatedAt so the reused row sorts to the top of the book.
    existing.updatedAt = new Date();
    await manager.save(Address, existing);
    return existing;
  }

  private dedupeKeyFor(dto: CreateUserAddressDto): string {
    return buildAddressDedupeKey({
      recipientName: dto.recipientName ?? '',
      recipientPhone: dto.recipientPhone ?? '',
      provinceId: dto.provinceId ?? '',
      wardId: dto.wardId ?? '',
      addressLine: dto.addressLine ?? '',
    });
  }

  private dedupeKeyForEntity(a: Address): string {
    return buildAddressDedupeKey({
      recipientName: a.recipientName ?? '',
      recipientPhone: a.recipientPhone ?? '',
      provinceId: a.provinceId ?? '',
      wardId: a.wardId ?? '',
      addressLine: a.streetLine1 ?? '',
    });
  }

  /** Map address-book DTO field names onto the reused `addresses` columns. */
  private toEntityFields(
    dto: CreateUserAddressDto | UpdateUserAddressDto,
  ): Partial<Address> {
    const out: Partial<Address> = {};
    if (dto.recipientName !== undefined) out.recipientName = dto.recipientName.trim();
    if (dto.recipientPhone !== undefined) out.recipientPhone = dto.recipientPhone.trim();
    if (dto.provinceId !== undefined) out.provinceId = dto.provinceId.trim();
    if (dto.provinceName !== undefined) out.province = dto.provinceName.trim();
    if (dto.wardId !== undefined) out.wardId = dto.wardId.trim();
    if (dto.wardName !== undefined) out.ward = dto.wardName.trim();
    if (dto.district !== undefined) out.district = dto.district.trim();
    if (dto.addressLine !== undefined) out.streetLine1 = dto.addressLine.trim();
    if (dto.label !== undefined) out.label = dto.label.trim();
    return out;
  }
}
