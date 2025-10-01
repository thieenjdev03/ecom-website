import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('products')
@Index(['status', 'updatedAt'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 'published' })
  status: 'draft' | 'published' | 'archived';

  @Column({ type: 'uuid', nullable: true })
  defaultVariantId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  priceOriginal: string;

  @Column({ default: '' })
  attribute: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
