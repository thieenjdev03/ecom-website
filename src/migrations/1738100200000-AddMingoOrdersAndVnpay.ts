import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMingoOrdersAndVnpay1738100200000 implements MigrationInterface {
  name = 'AddMingoOrdersAndVnpay1738100200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders ALTER COLUMN "userId" DROP NOT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user;
    `);
    await queryRunner.query(`
      ALTER TABLE orders
      ADD CONSTRAINT fk_orders_user
      FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS vnpay_txn_ref VARCHAR(64),
        ADD COLUMN IF NOT EXISTS vnpay_transaction_no VARCHAR(64),
        ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS shipping_zone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(20),
        ADD COLUMN IF NOT EXISTS distributor_id UUID,
        ADD COLUMN IF NOT EXISTS shipping_snapshot JSONB,
        ADD COLUMN IF NOT EXISTS cart_id UUID;
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_vnpay_txn_ref ON orders(vnpay_txn_ref) WHERE vnpay_txn_ref IS NOT NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_reservation_expiry ON orders(reservation_expires_at) WHERE stock_reserved = TRUE;`);

    // Existing databases may have the check created by the initial orders migration.
    await queryRunner.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;`);
    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
        'NEW', 'DELIVERING',
        'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'PACKED', 'READY_TO_GO',
        'AT_CARRIER_FACILITY', 'IN_TRANSIT', 'ARRIVED_IN_COUNTRY',
        'AT_LOCAL_FACILITY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
        'FAILED', 'REFUNDED'
      ));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_reservation_expiry;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_payment_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_vnpay_txn_ref;`);
    await queryRunner.query(`
      ALTER TABLE orders
        DROP COLUMN IF EXISTS distributor_id,
        DROP COLUMN IF EXISTS cart_id,
        DROP COLUMN IF EXISTS shipping_snapshot,
        DROP COLUMN IF EXISTS fulfillment_type,
        DROP COLUMN IF EXISTS shipping_zone,
        DROP COLUMN IF EXISTS stock_reserved,
        DROP COLUMN IF EXISTS reservation_expires_at,
        DROP COLUMN IF EXISTS vnpay_transaction_no,
        DROP COLUMN IF EXISTS vnpay_txn_ref,
        DROP COLUMN IF EXISTS payment_status;
    `);
    await queryRunner.query(`
      ALTER TABLE orders ALTER COLUMN "userId" SET NOT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user;
    `);
    await queryRunner.query(`
      ALTER TABLE orders
      ADD CONSTRAINT fk_orders_user
      FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;`);
    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
        'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'PACKED', 'READY_TO_GO',
        'AT_CARRIER_FACILITY', 'IN_TRANSIT', 'ARRIVED_IN_COUNTRY',
        'AT_LOCAL_FACILITY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
        'FAILED', 'REFUNDED'
      ));
    `);
  }
}
