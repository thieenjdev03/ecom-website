import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Retain orders created on or after 2026-08-19 00:00:00 (Asia/Ho_Chi_Minh),
 * which is the beginning of the day before this cleanup was requested.
 *
 * The cutoff is intentionally fixed rather than based on CURRENT_DATE: a
 * migration may run later in another environment, and must not then delete a
 * different, moving window of orders.
 */
export class PurgeOrdersBefore20260819_1739100000000
  implements MigrationInterface
{
  name = "PurgeOrdersBefore20260819_1739100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "orders"
      WHERE "createdAt" < TIMESTAMP '2026-08-19 00:00:00';
    `);
  }

  public async down(): Promise<void> {
    // Deleted production data cannot be reconstructed by a down migration.
  }
}
