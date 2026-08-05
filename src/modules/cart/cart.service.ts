import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { createHash } from 'crypto';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  /** Resolve a { vi, en } JSONB field to a plain string for the given locale. */
  private getLocalizedValue(field: any, locale = 'en'): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    const firstNonEmpty = Object.values(field).find(
      (v) => typeof v === 'string' && v.trim() !== '',
    );
    return field[locale] || field['en'] || (firstNonEmpty as string) || '';
  }

  private requireToken(token?: string): string {
    const trimmed = token?.trim();
    if (!trimmed) {
      throw new BadRequestException('Missing X-Cart-Token header');
    }
    return trimmed;
  }

  /** The raw X-Cart-Token is never stored — carts are keyed by its SHA-256 hex. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Load a cart by (raw) token with its items + products, or null. */
  private async loadCart(token: string): Promise<Cart | null> {
    return this.cartsRepository.findOne({
      where: { token_hash: this.hashToken(token) },
      relations: { items: { product: true } },
      order: { items: { created_at: 'ASC' } },
    });
  }

  /** Find the cart for this token, creating an empty one if it does not exist. */
  private async findOrCreateCart(token: string): Promise<Cart> {
    const existing = await this.loadCart(token);
    if (existing) return existing;

    const cart = this.cartsRepository.create({
      token_hash: this.hashToken(token),
      items: [],
    });
    await this.cartsRepository.save(cart);
    // Reload so relations are consistently shaped for buildResponse.
    return (await this.loadCart(token)) as Cart;
  }

  /**
   * Shape a Cart entity into the storefront CartResponseDto: prices/availability
   * are computed live from the joined product (never trusted from the client).
   */
  private buildResponse(cart: Cart | null, locale = 'en'): CartResponseDto {
    if (!cart) {
      return { id: '', items: [], subtotal: 0, totalQuantity: 0, valid: false };
    }

    const items = (cart.items ?? []).map((item) => {
      const product = item.product ?? null;
      // A soft-deleted / detached product comes back null via the relation.
      const stock = product ? Number(product.stock_quantity) : 0;
      const available = Boolean(
        product && product.status === 'active' && stock > 0,
      );
      const unitPrice = product
        ? Number(product.sale_price ?? product.price)
        : 0;
      const images = Array.isArray(product?.images) ? product!.images : [];

      return {
        id: item.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        product: {
          id: item.product_id,
          name: product ? this.getLocalizedValue(product.name, locale) : '',
          slug: product ? this.getLocalizedValue(product.slug, locale) : '',
          image: images.length > 0 ? images[0] : null,
          stock,
          available,
        },
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const valid =
      items.length > 0 &&
      items.every((i) => i.product.available && i.quantity <= i.product.stock);

    return { id: cart.id, items, subtotal, totalQuantity, valid };
  }

  async getCart(token: string | undefined, locale = 'en'): Promise<CartResponseDto> {
    const trimmed = token?.trim();
    if (!trimmed) {
      // No token yet -> nothing to show; the storefront sends one on first mutation.
      return this.buildResponse(null, locale);
    }
    return this.buildResponse(await this.loadCart(trimmed), locale);
  }

  async addItem(
    token: string | undefined,
    dto: AddCartItemDto,
    locale = 'en',
  ): Promise<CartResponseDto> {
    const tk = this.requireToken(token);

    const product = await this.productsRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product "${dto.productId}" not found`);
    }
    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available for purchase');
    }

    const cart = await this.findOrCreateCart(tk);
    const existing = await this.cartItemsRepository.findOne({
      where: { cart_id: cart.id, product_id: dto.productId },
    });

    if (existing) {
      existing.quantity += dto.quantity;
      await this.cartItemsRepository.save(existing);
    } else {
      await this.cartItemsRepository.save(
        this.cartItemsRepository.create({
          cart_id: cart.id,
          product_id: dto.productId,
          quantity: dto.quantity,
        }),
      );
    }

    return this.buildResponse(await this.loadCart(tk), locale);
  }

  async updateItem(
    token: string | undefined,
    itemId: string,
    dto: UpdateCartItemDto,
    locale = 'en',
  ): Promise<CartResponseDto> {
    const tk = this.requireToken(token);
    const cart = await this.loadCart(tk);
    if (!cart) throw new NotFoundException('Cart not found');

    const item = (cart.items ?? []).find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity <= 0) {
      await this.cartItemsRepository.remove(item);
    } else {
      item.quantity = dto.quantity;
      await this.cartItemsRepository.save(item);
    }

    return this.buildResponse(await this.loadCart(tk), locale);
  }

  async removeItem(
    token: string | undefined,
    itemId: string,
    locale = 'en',
  ): Promise<CartResponseDto> {
    const tk = this.requireToken(token);
    const cart = await this.loadCart(tk);
    if (!cart) throw new NotFoundException('Cart not found');

    const item = (cart.items ?? []).find((i) => i.id === itemId);
    if (item) {
      await this.cartItemsRepository.remove(item);
    }

    return this.buildResponse(await this.loadCart(tk), locale);
  }

  async clear(token: string | undefined): Promise<void> {
    const tk = this.requireToken(token);
    const cart = await this.cartsRepository.findOne({
      where: { token_hash: this.hashToken(tk) },
    });
    if (!cart) return;
    await this.cartItemsRepository.delete({ cart_id: cart.id });
  }

  /**
   * Called after login: attach the guest (token) cart to the user and fold any
   * pre-existing user carts (from other sessions) into it. The storefront keeps
   * using the same token, so the token cart stays the single source of truth.
   */
  async merge(
    token: string | undefined,
    userId: string,
    locale = 'en',
  ): Promise<CartResponseDto> {
    const tk = this.requireToken(token);
    const cart = await this.findOrCreateCart(tk);

    // Other carts already owned by this user (different token/session).
    const otherCarts = await this.cartsRepository.find({
      where: { user_id: userId, id: Not(cart.id) },
      relations: { items: true },
    });

    if (otherCarts.length > 0) {
      const currentItems = await this.cartItemsRepository.find({
        where: { cart_id: cart.id },
      });
      const byProduct = new Map(currentItems.map((i) => [i.product_id, i]));

      for (const other of otherCarts) {
        for (const item of other.items ?? []) {
          const existing = byProduct.get(item.product_id);
          if (existing) {
            existing.quantity += item.quantity;
            await this.cartItemsRepository.save(existing);
          } else {
            const moved = this.cartItemsRepository.create({
              cart_id: cart.id,
              product_id: item.product_id,
              quantity: item.quantity,
            });
            await this.cartItemsRepository.save(moved);
            byProduct.set(item.product_id, moved);
          }
        }
      }

      await this.cartsRepository.remove(otherCarts);
    }

    cart.user_id = userId;
    await this.cartsRepository.save(cart);

    return this.buildResponse(await this.loadCart(tk), locale);
  }
}
