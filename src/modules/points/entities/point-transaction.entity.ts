import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { PointTransactionType } from '../enums/point-transaction-type.enum';

/**
 * Sổ cái (ledger) điểm loyalty. Mỗi dòng là một lần cộng/trừ điểm gắn với một order.
 *
 * Idempotency: unique (orderId, type) — một đơn chỉ EARN một lần và REVERSE một lần,
 * dù handler đổi trạng thái có chạy lại nhiều lần. `pointsBalance` trên bảng `user`
 * là cache của tổng ledger này (xem PointsService — ghi ledger + update cache trong
 * cùng 1 transaction, có pessimistic lock).
 *
 * `points` luôn là số dương (magnitude); hướng cộng/trừ do `type` quyết định.
 */
@Entity('point_transaction')
@Unique('UQ_point_transaction_order_type', ['orderId', 'type'])
@Index('IDX_point_transaction_user_created', ['userId', 'createdAt'])
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  orderId: string;

  @Column({ type: 'varchar', length: 20 })
  type: PointTransactionType;

  @Column({ type: 'int' })
  points: number;

  @CreateDateColumn()
  createdAt: Date;
}
