import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrackingHistoryToOrders1734300000000 implements MigrationInterface {
  name = 'AddTrackingHistoryToOrders1734300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tracking_history column to orders table
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "tracking_history" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    // Create index for better performance on status queries
    await queryRunner.query(`
      CREATE INDEX "idx_orders_tracking_history" ON "orders" USING gin ("tracking_history")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_tracking_history"`);

    // Drop the column
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "tracking_history"`);
  }
}
