import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CartItem } from './cart-item.entity';

/**
 * A shopping cart. Guest carts are keyed by `token` (the storefront's X-Cart-Token
 * header); on login the cart is associated with a user via `user_id` (see merge).
 */
@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // SHA-256 hex of the storefront's X-Cart-Token (raw token is never stored). char(64).
  @Column({ type: 'char', length: 64, nullable: true, unique: true })
  token_hash: string | null;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
