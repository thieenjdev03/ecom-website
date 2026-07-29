import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Address } from '../../addresses/address.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentStatus } from '../enums/order-status.enum';

export { OrderStatus };

export interface OrderItem {
  productId: string; // UUID string
  productName: string;
  productSlug: string;
  variantId?: string; // For products with variants
  variantName?: string;
  quantity: number;
  unitPrice: string; // Formatted as string with two decimals (e.g., "29.99")
  totalPrice: string; // Formatted as string with two decimals (e.g., "59.98")
  sku?: string;
  productThumbnailUrl?: string; // Added when fetching order detail, first image from product.images array
  weightGrams?: number | null;
}

export interface TrackingHistoryItem {
  from_status: OrderStatus; // status trước
  to_status: OrderStatus; // status mới
  changed_at: Date; // thời điểm đổi
  changed_by: string; // userId / SYSTEM / CRON
  note?: string | null; // optional
}

export interface OrderSummary {
  subtotal: string; // Formatted as string with two decimals (e.g., "59.98")
  shipping: string; // Formatted as string with two decimals (e.g., "5.99")
  tax: string; // Formatted as string with two decimals (e.g., "6.60")
  discount: string; // Formatted as string with two decimals (e.g., "0.00")
  total: string; // Formatted as string with two decimals (e.g., "72.57")
  currency: string;
}

@Entity('orders')
@Index('idx_orders_userId', ['userId'])
@Index('idx_orders_status', ['status'])
@Index('idx_orders_paypalOrderId', ['paypalOrderId'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User relationship
  @Column('uuid', { nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Order details
  @Column({ length: 50, unique: true })
  orderNumber: string; // Format: ORD-YYYYMMDD-XXXX

  @Column({ length: 30, default: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus;

  // Tracking history for status changes
  @Column({ type: 'jsonb', default: [] })
  tracking_history: TrackingHistoryItem[];

  @Column({ length: 20, nullable: true })
  paymentMethod: 'PAYPAL' | 'STRIPE' | 'COD' | 'VIETQR' | 'VNPAY';

  @Column({ name: 'payment_status', length: 20, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ name: 'vnpay_txn_ref', length: 64, unique: true, nullable: true })
  vnpayTxnRef: string | null;

  @Column({ name: 'vnpay_transaction_no', length: 64, nullable: true })
  vnpayTransactionNo: string | null;

  // PayPal integration
  @Column({ length: 100, nullable: true })
  paypalOrderId: string;

  @Column({ length: 100, nullable: true })
  paypalTransactionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paidAmount: string; // Stored as decimal in DB but handled as string for PayPal compatibility

  @Column({ length: 3, nullable: true })
  paidCurrency: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ name: 'reservation_expires_at', type: 'timestamp', nullable: true })
  reservationExpiresAt: Date | null;

  @Column({ name: 'stock_reserved', default: false })
  stockReserved: boolean;

  // Order items and pricing
  @Column({ type: 'jsonb' })
  items: OrderItem[];

  @Column({ type: 'jsonb' })
  summary: OrderSummary;

  // Shipping information
  @Column('uuid', { nullable: true })
  shippingAddressId: string;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'shippingAddressId' })
  shippingAddress: Address;

  @Column('uuid', { nullable: true })
  billingAddressId: string;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'billingAddressId' })
  billingAddress: Address;

  @Column({ name: 'shipping_zone', length: 20, nullable: true })
  shippingZone: 'INNER_CITY' | 'OUTER_CITY' | null;

  @Column({ name: 'fulfillment_type', length: 20, nullable: true })
  fulfillmentType: 'DIRECT' | 'DEALER' | null;

  @Column({ name: 'distributor_id', type: 'uuid', nullable: true })
  distributorId: string | null;

  @Column({ name: 'shipping_snapshot', type: 'jsonb', nullable: true })
  shippingSnapshot: {
    receiver_name: string;
    phone: string;
    email?: string;
    province_code: string;
    district_code: string;
    ward_code?: string;
    address_line: string;
    province_name?: string;
    district_name?: string;
    ward_name?: string;
  } | null;

  @Column({ name: 'cart_id', type: 'uuid', nullable: true })
  cartId: string | null;

  // Additional information
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  // Tracking
  @Column({ length: 100, nullable: true })
  trackingNumber: string;

  @Column({ length: 100, nullable: true })
  carrier: string;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
