import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { Product, LangObject } from '../products/entities/product.entity';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  hashToken(token: string): string {
    this.validateToken(token);
    return createHash('sha256').update(token).digest('hex');
  }

  async getCart(token: string, locale = 'vi') {
    const cart = await this.getOrCreateGuestCart(token);
    return this.toResponse(await this.loadCart(cart.id), locale);
  }

  async addItem(token: string, dto: AddCartItemDto, locale = 'vi') {
    const cart = await this.getOrCreateGuestCart(token);
    const product = await this.getSellableProduct(dto.productId);
    const current = await this.itemRepository.findOne({
      where: { cart_id: cart.id, product_id: product.id },
    });
    const quantity = (current?.quantity ?? 0) + dto.quantity;
    this.assertStock(product, quantity);

    await this.itemRepository.save(
      current
        ? Object.assign(current, { quantity })
        : this.itemRepository.create({
            cart_id: cart.id,
            product_id: product.id,
            quantity,
          }),
    );
    return this.toResponse(await this.loadCart(cart.id), locale);
  }

  async updateItem(
    token: string,
    itemId: string,
    dto: UpdateCartItemDto,
    locale = 'vi',
  ) {
    const cart = await this.getOrCreateGuestCart(token);
    const item = await this.itemRepository.findOne({
      where: { id: itemId, cart_id: cart.id },
      relations: ['product'],
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
    }
    this.assertSellable(item.product);
    this.assertStock(item.product, dto.quantity);
    item.quantity = dto.quantity;
    await this.itemRepository.save(item);
    return this.toResponse(await this.loadCart(cart.id), locale);
  }

  async removeItem(token: string, itemId: string, locale = 'vi') {
    const cart = await this.getOrCreateGuestCart(token);
    const result = await this.itemRepository.delete({
      id: itemId,
      cart_id: cart.id,
    });
    if (!result.affected) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
    }
    return this.toResponse(await this.loadCart(cart.id), locale);
  }

  async clear(token: string) {
    const cart = await this.findCartByToken(token);
    if (cart) {
      await this.itemRepository.delete({ cart_id: cart.id });
    }
    return { cleared: true };
  }

  async getCheckoutCart(token: string): Promise<Cart> {
    const cart = await this.findCartByToken(token);
    if (!cart) {
      throw new BadRequestException('Giỏ hàng không tồn tại hoặc đã hết hạn');
    }
    const loaded = await this.loadCart(cart.id);
    if (!loaded.items.length) {
      throw new BadRequestException('Giỏ hàng đang trống');
    }
    return loaded;
  }

  async getCartRecord(token: string): Promise<Cart> {
    const cart = await this.findCartByToken(token);
    if (!cart) throw new BadRequestException('Giỏ hàng không tồn tại hoặc đã hết hạn');
    return cart;
  }

  async mergeGuestCart(token: string, userId: string, locale = 'vi') {
    const guest = await this.findCartByToken(token);
    let userCart = await this.cartRepository.findOne({
      where: { user_id: userId },
    });

    if (!guest && !userCart) {
      userCart = await this.cartRepository.save(
        this.cartRepository.create({
          user_id: userId,
          token_hash: this.hashToken(token),
        }),
      );
    } else if (guest && !userCart) {
      guest.user_id = userId;
      userCart = await this.cartRepository.save(guest);
    } else if (guest && userCart && guest.id !== userCart.id) {
      const [guestItems, userItems] = await Promise.all([
        this.itemRepository.find({ where: { cart_id: guest.id } }),
        this.itemRepository.find({ where: { cart_id: userCart.id } }),
      ]);
      const userByProduct = new Map(
        userItems.map((item) => [item.product_id, item]),
      );
      for (const guestItem of guestItems) {
        const existing = userByProduct.get(guestItem.product_id);
        if (existing) {
          existing.quantity += guestItem.quantity;
          await this.itemRepository.save(existing);
        } else {
          guestItem.cart_id = userCart.id;
          await this.itemRepository.save(guestItem);
        }
      }
      // Release the guest token before assigning it to the authenticated cart.
      // The token hash has a partial unique index, so saving in the opposite
      // order can fail even though the guest cart is removed immediately after.
      guest.token_hash = null;
      await this.cartRepository.save(guest);
      userCart.token_hash = this.hashToken(token);
      await this.cartRepository.save(userCart);
      await this.cartRepository.delete(guest.id);
    }

    return this.toResponse(await this.loadCart(userCart!.id), locale);
  }

  private async getOrCreateGuestCart(token: string): Promise<Cart> {
    const tokenHash = this.hashToken(token);
    const existing = await this.cartRepository.findOne({
      where: { token_hash: tokenHash },
    });
    if (existing) return existing;
    return this.cartRepository.save(
      this.cartRepository.create({ token_hash: tokenHash, user_id: null }),
    );
  }

  private async findCartByToken(token: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { token_hash: this.hashToken(token) },
    });
  }

  private loadCart(id: string): Promise<Cart> {
    return this.cartRepository.findOneOrFail({
      where: { id },
      relations: ['items', 'items.product'],
      order: { items: { created_at: 'ASC' } },
    });
  }

  private async getSellableProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    this.assertSellable(product);
    return product;
  }

  private assertSellable(product: Product) {
    if (product.status !== 'active') {
      throw new BadRequestException('Sản phẩm hiện không thể mua');
    }
  }

  private assertStock(product: Product, quantity: number) {
    if (product.stock_quantity < quantity) {
      throw new BadRequestException(
        `Sản phẩm "${this.localize(product.name, 'vi')}" chỉ còn ${product.stock_quantity} sản phẩm`,
      );
    }
  }

  private effectivePrice(product: Product): number {
    const price =
      product.sale_price != null && Number(product.sale_price) > 0
        ? product.sale_price
        : product.price;
    return Number(price);
  }

  private localize(value: LangObject | string | null, locale: string): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return (
      value[locale] ||
      value.vi ||
      value.en ||
      Object.values(value).find(Boolean) ||
      ''
    );
  }

  private toResponse(cart: Cart, locale: string) {
    const items = cart.items.map((item) => {
      const unitPrice = this.effectivePrice(item.product);
      const available =
        item.product.status === 'active' &&
        item.product.stock_quantity >= item.quantity;
      return {
        id: item.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        product: {
          id: item.product.id,
          name: this.localize(item.product.name, locale),
          slug: this.localize(item.product.slug, locale),
          image: item.product.images?.[0] ?? null,
          stock: item.product.stock_quantity,
          available,
        },
      };
    });
    return {
      id: cart.id,
      items,
      subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      valid: items.length > 0 && items.every((item) => item.product.available),
    };
  }

  private validateToken(token: string) {
    if (!token || !/^[A-Za-z0-9_-]{32,256}$/.test(token)) {
      throw new BadRequestException(
        'Thiếu hoặc không hợp lệ header X-Cart-Token',
      );
    }
  }
}
