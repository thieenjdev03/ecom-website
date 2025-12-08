import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { ProductCollection } from '../../collections/entities/product-collection.entity';

export type LangObject = Record<string, string | null>;

export interface ProductVariant {
  name: LangObject;
  color_id: string;
  size_id: string;
  sku: string;
  price: number;
  stock: number;
  barcode?: string;
  image_url?: string;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  name: LangObject;

  @Column({ type: 'jsonb' })
  slug: LangObject;

  @Column({ type: 'jsonb', nullable: true })
  description: LangObject;

  @Column({ type: 'jsonb', nullable: true })
  short_description: LangObject;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sale_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost_price: number;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ type: 'jsonb', default: [] })
  variants: ProductVariant[];

  @Column({ default: 0 })
  stock_quantity: number;

  @Column({ length: 100, unique: true, nullable: true })
  sku: string;

  @Column({ length: 100, nullable: true })
  barcode: string;

  @Column({ type: 'uuid', nullable: true })
  category_id: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductCollection, (productCollection) => productCollection.product)
  productCollections: ProductCollection[];

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'discontinued';

  @Column({ default: false })
  is_featured: boolean;

  @Column({ default: false })
  enable_sale_tag: boolean;

  @Column({ type: 'jsonb', nullable: true })
  meta_title: LangObject | null;

  @Column({ type: 'jsonb', nullable: true })
  meta_description: LangObject | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: ProductDimensions;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
