import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'json' })
  items: any[];

  @Column({ type: 'json', nullable: true })
  shippingAddress?: any;

  @Column({ type: 'json', nullable: true })
  paymentInfo?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
