import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/product.entity';
import { ProductVariant } from '../../products/entity/product-variant.entity';

@Entity('cart_items')
@Unique(['cartId', 'productVariantId'])
@Index(['cartId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  cartId: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column('uuid')
  productVariantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productVariantId' })
  productVariant: ProductVariant;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // Snapshot prices at add-to-cart time
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitPrice: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  unitCompareAtPrice: string;

  @Column({ nullable: true })
  discountCode: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  taxRate: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

