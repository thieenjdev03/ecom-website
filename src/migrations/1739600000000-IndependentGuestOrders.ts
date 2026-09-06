import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndependentGuestOrders1739600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders"
      ADD COLUMN "guestEmail" varchar(320),
      ADD COLUMN "guestPhone" varchar(20),
      ADD COLUMN "guestTrackingTokenHash" varchar(64),
      ADD COLUMN "shippingSnapshot" jsonb`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Never discard guest orders or their contact information during rollback.
    const rows = await queryRunner.query(`SELECT 1 FROM "orders" WHERE "userId" IS NULL LIMIT 1`);
    if (rows.length) throw new Error('Cannot revert while independent guest orders exist');
    await queryRunner.query(`ALTER TABLE "orders"
      DROP COLUMN "guestEmail", DROP COLUMN "guestPhone",
      DROP COLUMN "guestTrackingTokenHash", DROP COLUMN "shippingSnapshot"`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "userId" SET NOT NULL`);
  }
}
