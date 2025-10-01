import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Product } from '../product.entity';

@Entity('product_variants')
@Index(['productId'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  priceOriginal: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  priceFinal: string;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  stockOnHand: number;

  @Column({ type: 'int', default: 0 })
  stockReserved: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


