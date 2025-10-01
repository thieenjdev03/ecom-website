import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { User } from '../../users/user.entity';
import { CartItem } from './cart-item.entity';

export enum CartStatus {
  ACTIVE = 'active',
  CONVERTED = 'converted',
  ABANDONED = 'abandoned',
  EXPIRED = 'expired',
}

@Entity('carts')
@Index(['userId'])
@Index(['sessionId'])
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ length: 3, default: 'VND' })
  currency: string;

  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.ACTIVE })
  status: CartStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];
}

