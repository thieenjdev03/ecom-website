import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('product_price_rules')
export class ProductPriceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  productId: string | null;

  @Column('uuid', { nullable: true })
  variantId: string | null;

  @Column({ default: 'percent' })
  type: 'percent' | 'fixed';

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: string;

  @Column({ type: 'timestamptz', nullable: true })
  startAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @Column({ type: 'int', default: 0 })
  priority: number;
}


