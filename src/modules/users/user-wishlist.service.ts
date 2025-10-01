import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWishlist } from './entities/user-wishlist.entity';
import { AddToWishlistDto, UpdateWishlistDto } from './dto/wishlist.dto';

@Injectable()
export class UserWishlistService {
  constructor(
    @InjectRepository(UserWishlist)
    private readonly wishlistRepo: Repository<UserWishlist>,
  ) {}

  async findAllByUser(userId: string): Promise<UserWishlist[]> {
    return this.wishlistRepo.find({
      where: { userId },
      relations: ['product', 'productVariant'],
      order: { createdAt: 'DESC' },
    });
  }

  async addToWishlist(userId: string, dto: AddToWishlistDto): Promise<UserWishlist> {
    // Check if already in wishlist
    const existing = await this.wishlistRepo.findOne({
      where: {
        userId,
        productId: dto.productId,
        productVariantId: dto.productVariantId || null,
      },
    });

    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    const wishlistItem = this.wishlistRepo.create({
      userId,
      productId: dto.productId,
      productVariantId: dto.productVariantId || null,
      note: dto.note,
    });

    return this.wishlistRepo.save(wishlistItem);
  }

  async updateWishlistItem(userId: string, itemId: string, dto: UpdateWishlistDto): Promise<UserWishlist> {
    const item = await this.wishlistRepo.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    Object.assign(item, dto);
    return this.wishlistRepo.save(item);
  }

  async removeFromWishlist(userId: string, itemId: string): Promise<void> {
    const item = await this.wishlistRepo.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.wishlistRepo.remove(item);
  }

  async clearWishlist(userId: string): Promise<void> {
    await this.wishlistRepo.delete({ userId });
  }

  async isInWishlist(userId: string, productId: string, productVariantId?: string): Promise<boolean> {
    const count = await this.wishlistRepo.count({
      where: {
        userId,
        productId,
        productVariantId: productVariantId || null,
      },
    });

    return count > 0;
  }
}

