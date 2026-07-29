import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProductCollection } from './product-collection.entity';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  banner_image_url: string;

  @Column({ length: 500, nullable: true })
  mobile_banner_image_url: string;

  @Column({ length: 100, nullable: true })
  cta_label: string;

  @Column({ length: 20, default: 'NORMAL' })
  placement: 'HERO' | 'HOME_SECTION' | 'NORMAL';

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ length: 255, nullable: true })
  seo_title: string;

  @Column({ type: 'text', nullable: true })
  seo_description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ length: 50, nullable: true })
  homepage_section: string;

  @OneToMany(() => ProductCollection, (productCollection) => productCollection.collection)
  productCollections: ProductCollection[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
