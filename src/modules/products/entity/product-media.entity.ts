import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Product } from '../product.entity';

@Entity('product_media')
@Index(['productId', 'position'])
export class ProductMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  url: string;

  @Column({ default: 'image' })
  type: 'image' | 'video';

  @Column({ default: 0 })
  position: number;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: false })
  isHover: boolean;

  @Column('uuid', { nullable: true })
  variantId: string | null;

  @Column({ nullable: true })
  alt: string;
}


