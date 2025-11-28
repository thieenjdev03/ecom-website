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
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Order details
  @Column({ length: 50, unique: true })
  orderNumber: string; // Format: ORD-YYYYMMDD-XXXX

  @Column({ length: 30, default: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus;

  @Column({ length: 20, nullable: true })
  paymentMethod: 'PAYPAL' | 'STRIPE' | 'COD';

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
