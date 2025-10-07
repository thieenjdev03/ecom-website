import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Color } from '../../colors/entities/color.entity';
import { Size } from '../../sizes/entities/size.entity';

@Entity('product_variants')
@Unique(['product', 'color', 'size'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @Index()
  product: Product;

  @ManyToOne(() => Color, { eager: true })
  @Index()
  color: Color;

  @ManyToOne(() => Size, { eager: true })
  @Index()
  size: Size;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'sale_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


