import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../products/entity/product-variant.entity';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  async getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart> {
    let cart: Cart;

    if (userId) {
      cart = await this.cartRepo.findOne({
        where: { userId, status: CartStatus.ACTIVE },
        relations: ['items', 'items.product', 'items.productVariant'],
      });
    } else if (sessionId) {
      cart = await this.cartRepo.findOne({
        where: { sessionId, userId: IsNull(), status: CartStatus.ACTIVE },
        relations: ['items', 'items.product', 'items.productVariant'],
      });
    }

    if (!cart) {
      // Create new cart
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

      cart = this.cartRepo.create({
        userId: userId || null,
        sessionId: sessionId || null,
        status: CartStatus.ACTIVE,
        currency: 'VND',
        expiresAt,
      });

      cart = await this.cartRepo.save(cart);
      cart.items = [];
    }

    return cart;
  }

  async addToCart(userId: string | undefined, sessionId: string | undefined, dto: AddToCartDto): Promise<Cart> {
    // Get variant and check stock
    const variant = await this.variantRepo.findOne({
      where: { id: dto.productVariantId },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const availableStock = variant.stockOnHand - variant.stockReserved;
    if (availableStock < dto.quantity) {
      throw new BadRequestException(`Only ${availableStock} items available in stock`);
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    // Check if item already exists in cart
    const existingItem = cart.items.find((item) => item.productVariantId === dto.productVariantId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + dto.quantity;
      
      if (availableStock < newQuantity) {
        throw new BadRequestException(`Only ${availableStock} items available in stock`);
      }

      existingItem.quantity = newQuantity;
      if (dto.discountCode) existingItem.discountCode = dto.discountCode;
      if (dto.metadata) existingItem.metadata = dto.metadata;

      await this.cartItemRepo.save(existingItem);
    } else {
      // Add new item
      const cartItem = this.cartItemRepo.create({
        cartId: cart.id,
        productId: variant.productId,
        productVariantId: variant.id,
        quantity: dto.quantity,
        unitPrice: variant.priceFinal,
        unitCompareAtPrice: variant.priceOriginal,
        discountCode: dto.discountCode,
        metadata: dto.metadata,
      });

      await this.cartItemRepo.save(cartItem);
      cart.items.push(cartItem);
    }

    return this.getOrCreateCart(userId, sessionId);
  }

  async updateCartItem(userId: string | undefined, sessionId: string | undefined, itemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock if quantity changed
    if (dto.quantity && dto.quantity !== item.quantity) {
      const variant = await this.variantRepo.findOne({ where: { id: item.productVariantId } });
      const availableStock = variant.stockOnHand - variant.stockReserved;
      
      if (availableStock < dto.quantity) {
        throw new BadRequestException(`Only ${availableStock} items available in stock`);
      }

      item.quantity = dto.quantity;
    }

    if (dto.discountCode !== undefined) item.discountCode = dto.discountCode;
    if (dto.metadata !== undefined) item.metadata = dto.metadata;

    await this.cartItemRepo.save(item);

    return this.getOrCreateCart(userId, sessionId);
  }

  async removeCartItem(userId: string | undefined, sessionId: string | undefined, itemId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepo.remove(item);

    return this.getOrCreateCart(userId, sessionId);
  }

  async clearCart(userId: string | undefined, sessionId: string | undefined): Promise<void> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await this.cartItemRepo.delete({ cartId: cart.id });
  }

  async mergeGuestCart(userId: string, sessionId: string): Promise<Cart> {
    // Get guest cart
    const guestCart = await this.cartRepo.findOne({
      where: { sessionId, userId: IsNull(), status: CartStatus.ACTIVE },
      relations: ['items'],
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(userId);
    }

    // Get or create user cart
    const userCart = await this.getOrCreateCart(userId);

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find((i) => i.productVariantId === guestItem.productVariantId);

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
        await this.cartItemRepo.save(existingItem);
      } else {
        guestItem.cartId = userCart.id;
        await this.cartItemRepo.save(guestItem);
      }
    }

    // Mark guest cart as abandoned
    guestCart.status = CartStatus.ABANDONED;
    await this.cartRepo.save(guestCart);

    return this.getOrCreateCart(userId);
  }

  async convertToOrder(cartId: string): Promise<void> {
    const cart = await this.cartRepo.findOne({ where: { id: cartId } });
    if (cart) {
      cart.status = CartStatus.CONVERTED;
      await this.cartRepo.save(cart);
    }
  }

  async expireOldCarts(): Promise<void> {
    const now = new Date();
    await this.cartRepo.update(
      { expiresAt: { lte: now } as any, status: CartStatus.ACTIVE },
      { status: CartStatus.EXPIRED },
    );
  }
}

