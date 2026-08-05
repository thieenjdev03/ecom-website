import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The orders.status CHECK constraint only allowed 9 of the 15 OrderStatus enum values,
 * so setting an order to PROCESSING / READY_TO_GO / AT_CARRIER_FACILITY /
 * ARRIVED_IN_COUNTRY / AT_LOCAL_FACILITY / OUT_FOR_DELIVERY failed at the DB level
 * ("violates check constraint orders_status_check"). Rebuild it to match the full enum
 * so admins can move an order into any stage of the fulfilment pipeline.
 */
export class SyncOrderStatusCheckWithEnum1738300000000 implements MigrationInterface {
  name = 'SyncOrderStatusCheckWithEnum1738300000000';

  // Keep in sync with src/modules/orders/enums/order-status.enum.ts
  private readonly ALL_STATUSES = [
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'PACKED',
    'READY_TO_GO',
    'CONFIRMED',
    'AT_CARRIER_FACILITY',
    'IN_TRANSIT',
    'ARRIVED_IN_COUNTRY',
    'AT_LOCAL_FACILITY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'FAILED',
    'REFUNDED',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = this.ALL_STATUSES.map((s) => `'${s}'`).join(', ');
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_status_check";`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "orders_status_check" CHECK (status IN (${values}));`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the previous (narrower) constraint.
    const previous = [
      'PENDING_PAYMENT',
      'PAID',
      'CONFIRMED',
      'PACKED',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED',
      'FAILED',
      'REFUNDED',
    ]
      .map((s) => `'${s}'`)
      .join(', ');
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_status_check";`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "orders_status_check" CHECK (status IN (${previous}));`,
    );
  }
}
