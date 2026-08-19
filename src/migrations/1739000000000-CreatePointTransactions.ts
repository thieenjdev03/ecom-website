import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Loyalty points:
 *  - Ledger table `point_transaction` (EARN/REVERSE) với unique (orderId, type)
 *    để đảm bảo idempotency.
 *  - Cache column `pointsBalance` trên bảng `user` (= tổng ledger).
 *
 * Guarded bằng IF NOT EXISTS vì DB production có drift so với source (xem memory
 * "Migration drift & cart schema"). Bảng user thực tế tên là "user" (TypeORM
 * default @Entity() -> snakeCase("User")), khớp với carts/pgcrypto migrations.
 */
export class CreatePointTransactions1739000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // pgcrypto (gen_random_uuid) đã bật ở migration 1701000000000; giữ an toàn.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "point_transaction" (
        "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"    uuid NOT NULL,
        "orderId"   uuid NOT NULL,
        "type"      varchar(20) NOT NULL,
        "points"    integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_point_transaction_order_type" UNIQUE ("orderId", "type"),
        CONSTRAINT "fk_point_transaction_user"
          FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
        CONSTRAINT "fk_point_transaction_order"
          FOREIGN KEY ("orderId") REFERENCES "orders"(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_point_transaction_user_created"
        ON "point_transaction" ("userId", "createdAt");
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
        ADD COLUMN IF NOT EXISTS "pointsBalance" integer NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "pointsBalance";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_point_transaction_user_created";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "point_transaction";`);
  }
}
