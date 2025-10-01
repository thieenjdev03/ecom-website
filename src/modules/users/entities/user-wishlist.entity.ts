import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../user.entity';
import { Product } from '../../products/product.entity';
import { ProductVariant } from '../../products/entity/product-variant.entity';

@Entity('user_wishlist_products')
@Unique(['userId', 'productId', 'productVariantId'])
@Index(['userId'])
@Index(['productId', 'productVariantId'])
export class UserWishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column('uuid', { nullable: true })
  productVariantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'productVariantId' })
  productVariant: ProductVariant;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}

