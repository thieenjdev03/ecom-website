import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { Address } from '../addresses/address.entity';
import { CartService } from '../cart/cart.service';
import { Order, OrderItem, OrderSummary } from '../orders/entities/order.entity';
import { OrderStatus, PaymentStatus } from '../orders/enums/order-status.enum';
import { Product, LangObject } from '../products/entities/product.entity';
import { VnpayService } from '../vnpay/vnpay.service';
import { CheckoutQuoteDto, CheckoutShippingAddressDto, CreateCheckoutOrderDto } from './dto/checkout.dto';

type CheckoutAddress = {
  recipientName: string;
  recipientPhone: string;
  email?: string;
  province: string;
  district: string;
  ward?: string;
  streetLine1: string;
  streetLine2?: string;
};

const FIXED_SHIPPING_FEE = 35_000;
const FIXED_SHIPPING = {
  serviceable: true,
  shipping_zone: 'OUTER_CITY' as const,
  shipping_fee: FIXED_SHIPPING_FEE,
  currency: 'VND' as const,
  fulfillment_type: 'DIRECT' as const,
  dealer: null,
};

@Injectable()
export class CheckoutService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cartService: CartService,
    private readonly vnpayService: VnpayService,
    @InjectRepository(Address) private readonly addresses: Repository<Address>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  async getOrder(orderNumber: string, cartToken: string) {
    const cart = await this.cartService.getCartRecord(cartToken);
    const order = await this.orders.findOne({ where: { orderNumber, cartId: cart.id } });
    if (!order) throw new BadRequestException('Không tìm thấy đơn hàng');
    return order;
  }

  async quote(cartToken: string, locale = 'vi') {
    const cart = await this.cartService.getCheckoutCart(cartToken);
    const items = this.buildItems(cart.items, locale);
    const summary = this.buildSummary(items, FIXED_SHIPPING_FEE);
    return {
      items,
      subtotal: Number(summary.subtotal),
      shippingFee: Number(summary.shipping),
      total: Number(summary.total),
      shippingZone: FIXED_SHIPPING.shipping_zone,
      fulfillmentType: FIXED_SHIPPING.fulfillment_type,
      dealer: null,
      serviceable: true,
      summary,
      shipping: FIXED_SHIPPING,
    };
  }

  async createOrder(userId: string | null, cartToken: string, dto: CreateCheckoutOrderDto, ipAddress: string, locale = 'vi') {
    await this.vnpayService.releaseExpiredReservations();
    const [quote, address] = await Promise.all([
      this.quote(cartToken, locale),
      this.getAddress(userId, dto),
    ]);
    const cart = await this.cartService.getCheckoutCart(cartToken);
    const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const txnRef = `MGO${Date.now()}${randomBytes(3).toString('hex').toUpperCase()}`;

    return this.dataSource.transaction(async (manager) => {
      for (const item of cart.items) {
        const result = await manager.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1 AND status = $3 RETURNING id',
          [item.quantity, item.product_id, 'active'],
        );
        if (!result.length) throw new BadRequestException(`Sản phẩm ${this.localize(item.product.name, locale)} đã hết hàng hoặc tồn kho thay đổi`);
      }

      const order = manager.create(Order, {
        userId,
        orderNumber: this.createOrderNumber(),
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: 'VNPAY',
        vnpayTxnRef: txnRef,
        items: quote.items,
        summary: quote.summary,
        shippingAddressId: dto.shipping_address_id ?? null,
        shippingSnapshot: {
          receiver_name: address.recipientName,
          phone: address.recipientPhone,
          email: address.email,
          province_code: dto.province_code,
          district_code: dto.district_code,
          address_line: [address.streetLine1, address.streetLine2]
            .filter(Boolean)
            .join(', '),
          province_name: address.province,
          district_name: address.district,
          ward_name: address.ward ?? undefined,
        },
        cartId: cart.id,
        notes: dto.notes ?? null,
        shippingZone: quote.shipping.shipping_zone,
        fulfillmentType: quote.shipping.fulfillment_type,
        distributorId: quote.shipping.dealer?.id ?? null,
        stockReserved: true,
        reservationExpiresAt,
      });
      const saved = await manager.save(order);
      const payment_url = this.vnpayService.createPaymentUrl(saved, ipAddress);
      return {
        order_id: saved.id,
        order_number: saved.orderNumber,
        orderId: saved.id,
        orderCode: saved.orderNumber,
        payment_status: saved.paymentStatus,
        order_status: saved.status,
        paymentStatus: saved.paymentStatus,
        orderStatus: saved.status,
        expires_at: reservationExpiresAt,
        payment_url,
        paymentUrl: payment_url,
        summary: saved.summary,
        shipping: quote.shipping,
      };
    });
  }

  private async getAddress(userId: string | null, dto: CheckoutQuoteDto): Promise<CheckoutAddress> {
    if (dto.shipping_address_id && dto.shipping_address) {
      throw new BadRequestException('Chỉ được cung cấp một địa chỉ giao hàng');
    }
    if (dto.shipping_address) return this.inlineAddress(dto.shipping_address);
    if (!userId || !dto.shipping_address_id) {
      throw new BadRequestException('Vui lòng cung cấp địa chỉ giao hàng');
    }
    const address = await this.addresses.findOne({ where: { id: dto.shipping_address_id, userId, isShipping: true } });
    if (!address) throw new BadRequestException('Địa chỉ giao hàng không hợp lệ');
    return address;
  }

  private inlineAddress(address: CheckoutShippingAddressDto): CheckoutAddress {
    return {
      recipientName: address.recipient_name,
      recipientPhone: address.recipient_phone,
      email: address.email,
      province: address.province,
      district: address.district,
      ward: address.ward,
      streetLine1: address.street_line_1,
      streetLine2: address.street_line_2,
    };
  }

  private buildItems(items: Array<{ product: Product; product_id: string; quantity: number }>, locale: string): OrderItem[] {
    return items.map((item) => {
      const product = item.product;
      if (product.status !== 'active' || product.stock_quantity < item.quantity) throw new BadRequestException(`Sản phẩm ${this.localize(product.name, locale)} không còn đủ tồn kho`);
      const unitPrice = Number(product.sale_price ?? product.price);
      return {
        productId: product.id,
        productName: this.localize(product.name, locale),
        productSlug: this.localize(product.slug, locale),
        quantity: item.quantity,
        unitPrice: unitPrice.toFixed(2),
        totalPrice: (unitPrice * item.quantity).toFixed(2),
        sku: product.sku ?? undefined,
        productThumbnailUrl: product.images?.[0] ?? undefined,
        weightGrams: product.weight_grams ?? null,
      };
    });
  }

  private buildSummary(items: OrderItem[], shippingFee: number): OrderSummary {
    const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    return {
      subtotal: subtotal.toFixed(2), shipping: Number(shippingFee).toFixed(2), tax: '0.00', discount: '0.00',
      total: (subtotal + Number(shippingFee)).toFixed(2), currency: 'VND',
    };
  }

  private localize(value: LangObject | string | null, locale: string) { return typeof value === 'string' ? value : value?.[locale] || value?.vi || value?.en || Object.values(value ?? {}).find(Boolean) || ''; }
  private createOrderNumber() { return `MGO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`; }
}
