import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus, PaymentStatus } from '../orders/enums/order-status.enum';
import { Product } from '../products/entities/product.entity';
import { CartItem } from '../cart/entities/cart-item.entity';

type VnpayParams = Record<string, string | number | undefined>;

@Injectable()
export class VnpayService {
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly paymentUrl: string;
  private readonly returnUrl: string;
  private readonly ipnUrl: string;

  constructor(private readonly config: ConfigService, private readonly dataSource: DataSource, @InjectRepository(Order) private readonly orders: Repository<Order>) {
    this.tmnCode = String(this.config.get('vnpay.tmnCode') ?? '');
    this.hashSecret = String(this.config.get('vnpay.hashSecret') ?? '');
    this.paymentUrl = String(this.config.get('vnpay.paymentUrl') ?? '');
    this.returnUrl = String(this.config.get('vnpay.returnUrl') ?? '');
    this.ipnUrl = String(this.config.get('vnpay.ipnUrl') ?? '');
  }

  createPaymentUrl(order: Order, ipAddress: string): string {
    this.assertConfigured();
    if (!order.vnpayTxnRef) throw new BadRequestException('Đơn hàng chưa có mã giao dịch VNPay');
    const params: VnpayParams = {
      vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: this.tmnCode,
      vnp_Amount: Math.round(Number(order.summary.total) * 100), vnp_CurrCode: 'VND',
      vnp_TxnRef: order.vnpayTxnRef, vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
      vnp_OrderType: 'other', vnp_Locale: 'vn', vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: ipAddress || '127.0.0.1', vnp_CreateDate: this.formatDate(new Date()),
      vnp_ExpireDate: order.reservationExpiresAt ? this.formatDate(order.reservationExpiresAt) : undefined,
    };
    return `${this.paymentUrl}?${this.sign(params)}`;
  }

  verify(query: Record<string, unknown>): boolean {
    if (!this.hashSecret) return false;
    const received = String(query.vnp_SecureHash ?? '');
    if (!received) return false;
    const params: VnpayParams = {};
    for (const [key, value] of Object.entries(query)) if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && value !== undefined) params[key] = String(value);
    const expected = this.hash(params, false);
    const actualBuffer = Buffer.from(received, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  }

  async handleIpn(query: Record<string, unknown>): Promise<{ RspCode: string; Message: string }> {
    if (!this.verify(query)) return { RspCode: '97', Message: 'Invalid signature' };
    const order = await this.orders.findOne({ where: { vnpayTxnRef: String(query.vnp_TxnRef ?? '') } });
    if (!order) return { RspCode: '01', Message: 'Order not found' };
    if (Number(query.vnp_Amount) !== Math.round(Number(order.summary.total) * 100)) return { RspCode: '04', Message: 'Invalid amount' };
    if (order.paymentStatus === PaymentStatus.PAID) return { RspCode: '02', Message: 'Order already confirmed' };
    const successful = String(query.vnp_ResponseCode) === '00' && String(query.vnp_TransactionStatus ?? '00') === '00';
    if (successful) await this.markPaid(order.id, String(query.vnp_TransactionNo ?? ''));
    else await this.failAndRelease(order.id);
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  async getReturnState(query: Record<string, unknown>) {
    const valid = this.verify(query);
    const order = valid ? await this.orders.findOne({ where: { vnpayTxnRef: String(query.vnp_TxnRef ?? '') } }) : null;
    return { valid, order_number: order?.orderNumber ?? null, payment_status: order?.paymentStatus ?? null, order_status: order?.status ?? null };
  }

  /** Releases timed-out reservations before a new checkout consumes stock. */
  async releaseExpiredReservations() {
    const expired = await this.orders
      .createQueryBuilder('order')
      .where('order.stock_reserved = TRUE')
      .andWhere('order.reservation_expires_at < NOW()')
      .andWhere('order.payment_status = :paymentStatus', { paymentStatus: PaymentStatus.PENDING })
      .getMany();
    for (const order of expired) await this.failAndRelease(order.id);
  }

  private async markPaid(orderId: string, transactionNo: string) {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId }, lock: { mode: 'pessimistic_write' } });
      if (!order || order.paymentStatus === PaymentStatus.PAID) return;
      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.PAID;
      order.vnpayTransactionNo = transactionNo || null;
      order.paidAmount = Number(order.summary.total).toFixed(2);
      order.paidCurrency = 'VND';
      order.paidAt = new Date();
      order.stockReserved = false;
      await manager.save(order);
      if (order.cartId) {
        await manager.delete(CartItem, { cart_id: order.cartId });
      }
    });
  }

  private async failAndRelease(orderId: string) {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId }, lock: { mode: 'pessimistic_write' } });
      if (!order || order.paymentStatus === PaymentStatus.PAID || order.status === OrderStatus.CANCELLED) return;
      if (order.stockReserved) for (const item of order.items) await manager.increment(Product, { id: item.productId }, 'stock_quantity', item.quantity);
      order.paymentStatus = PaymentStatus.FAILED;
      order.status = OrderStatus.CANCELLED;
      order.stockReserved = false;
      await manager.save(order);
    });
  }

  private sign(params: VnpayParams): string { return `${this.hash(params, true)}&vnp_SecureHash=${this.hash(params, false)}`; }
  private hash(params: VnpayParams, asQuery: boolean): string {
    const sorted = Object.keys(params).filter((key) => params[key] !== undefined && params[key] !== null).sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key])).replace(/%20/g, '+')}`).join('&');
    return asQuery ? sorted : createHmac('sha512', this.hashSecret).update(Buffer.from(sorted, 'utf8')).digest('hex');
  }
  private assertConfigured() { if (!this.tmnCode || !this.hashSecret || !this.paymentUrl || !this.returnUrl || !this.ipnUrl) throw new BadRequestException('VNPay chưa được cấu hình đầy đủ'); }
  private formatDate(date: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(date).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
    return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
  }
}
