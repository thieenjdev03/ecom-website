import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { PointTransaction } from './entities/point-transaction.entity';
import { PointTransactionType } from './enums/point-transaction-type.enum';
import { User } from '../users/user.entity';
import { Order } from '../orders/entities/order.entity';

const POINTS_DIVISOR = 10;

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Công thức tích điểm: floor(grandTotal / 10), grandTotal = order.summary.total. */
  private computeEarnPoints(order: Order): number {
    const total = Number(order.summary?.total ?? 0);
    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }
    return Math.floor(total / POINTS_DIVISOR);
  }

  /**
   * Cộng điểm khi đơn hoàn tất (DELIVERED). Idempotent: nếu đã có dòng EARN cho
   * order này thì bỏ qua. Ghi ledger + update cache pointsBalance trong CÙNG 1
   * transaction, có pessimistic write-lock trên dòng user để tránh race.
   */
  async earnForOrder(order: Order): Promise<void> {
    const points = this.computeEarnPoints(order);
    if (points <= 0) {
      return;
    }
    await this.applyLedger(order.userId, order.id, PointTransactionType.EARN, points);
  }

  /**
   * Trừ điểm khi đơn bị huỷ/hoàn tiền (CANCELLED/REFUNDED). Chỉ reverse đúng số
   * điểm đã EARN cho order đó; nếu chưa từng EARN thì không làm gì. Idempotent.
   */
  async reverseForOrder(order: Order): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const earned = await manager.findOne(PointTransaction, {
        where: { orderId: order.id, type: PointTransactionType.EARN },
      });
      if (!earned || earned.points <= 0) {
        return; // chưa tích điểm cho đơn này -> không có gì để reverse
      }
      const already = await manager.findOne(PointTransaction, {
        where: { orderId: order.id, type: PointTransactionType.REVERSE },
      });
      if (already) {
        return;
      }
      await this.writeLedgerAndUpdateBalance(
        manager,
        order.userId,
        order.id,
        PointTransactionType.REVERSE,
        earned.points,
        -earned.points,
      );
    });
  }

  private async applyLedger(
    userId: string,
    orderId: string,
    type: PointTransactionType,
    points: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(PointTransaction, {
        where: { orderId, type },
      });
      if (existing) {
        return;
      }
      const delta = type === PointTransactionType.REVERSE ? -points : points;
      await this.writeLedgerAndUpdateBalance(manager, userId, orderId, type, points, delta);
    });
  }

  private async writeLedgerAndUpdateBalance(
    manager: EntityManager,
    userId: string,
    orderId: string,
    type: PointTransactionType,
    points: number,
    balanceDelta: number,
  ): Promise<void> {
    // Pessimistic write-lock dòng user để tổng cache không bị race giữa các đơn.
    const user = await manager.findOne(User, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!user) {
      this.logger.warn(`Bỏ qua ghi điểm: user ${userId} không tồn tại (order ${orderId}).`);
      return;
    }

    try {
      await manager.insert(PointTransaction, { userId, orderId, type, points });
    } catch (err: any) {
      // Unique (orderId, type) — có thể do handler chạy song song. Coi như đã ghi.
      if (err?.code === '23505') {
        this.logger.debug(`Ledger ${type} cho order ${orderId} đã tồn tại (race), bỏ qua.`);
        return;
      }
      throw err;
    }

    const nextBalance = Math.max(0, (user.pointsBalance ?? 0) + balanceDelta);
    await manager.update(User, { id: userId }, { pointsBalance: nextBalance });
    this.logger.log(
      `Điểm ${type} ${balanceDelta >= 0 ? '+' : ''}${balanceDelta} cho user ${userId} ` +
        `(order ${orderId}) -> balance ${nextBalance}.`,
    );
  }

  async getBalance(userId: string): Promise<number> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      select: ['id', 'pointsBalance'],
    });
    return user?.pointsBalance ?? 0;
  }

  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: PointTransaction[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.dataSource.getRepository(PointTransaction).findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }
}
