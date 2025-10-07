import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductVariant } from './product-variant.entity';
import { Color } from '../../colors/entities/color.entity';
import { Size } from '../../sizes/entities/size.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_code', unique: true, length: 100 })
  @Index()
  productCode: string;

  @Column({ name: 'product_sku', length: 100, nullable: true })
  productSku: string;

  @ManyToOne(() => Category, { eager: true })
  category: Category;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'text', array: true, default: [] })
  gender: string[];

  @Column({ name: 'sale_label', nullable: true })
  saleLabel: string;

  @Column({ name: 'new_label', nullable: true })
  newLabel: string;

  @Column({ name: 'is_sale', default: false })
  isSale: boolean;

  @Column({ name: 'images', type: 'text', array: true, default: [] })
  images: string[];

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_new', default: false })
  isNew: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @ManyToMany(() => Color, { eager: true })
  @JoinTable({
    name: 'product_colors',
    joinColumn: { name: 'product_id' },
    inverseJoinColumn: { name: 'color_id' },
  })
  colors: Color[];

  @ManyToMany(() => Size, { eager: true })
  @JoinTable({
    name: 'product_sizes',
    joinColumn: { name: 'product_id' },
    inverseJoinColumn: { name: 'size_id' },
  })
  sizes: Size[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


