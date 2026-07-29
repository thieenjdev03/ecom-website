import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CollapseOrderStatuses đã remap dữ liệu nhưng bỏ quên check constraint —
 * constraint cũ vẫn chặn CONFIRMED. Dựng lại theo đúng OrderStatus (9 giá trị).
 */
export class FixOrderStatusCheck1738100500000 implements MigrationInterface {
  name = 'FixOrderStatusCheck1738100500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_status_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "orders_status_check" CHECK ("status" IN (
        'PENDING_PAYMENT','PAID','CONFIRMED','PACKED','IN_TRANSIT',
        'DELIVERED','CANCELLED','FAILED','REFUNDED'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_status_check"`,
    );
  }
}
