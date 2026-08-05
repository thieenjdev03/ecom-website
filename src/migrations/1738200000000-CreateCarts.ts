import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Carts + cart_items. These tables already exist in the primary database from an
 * earlier (out-of-source) migration, so every statement is guarded with IF NOT EXISTS
 * to be a no-op there while still provisioning a fresh database correctly.
 *
 * Schema matches the live tables: carts are keyed by token_hash char(64) (SHA-256 of
 * the storefront X-Cart-Token); updated_at is managed by TypeORM, not a DB trigger.
 */
export class CreateCarts1738200000000 implements MigrationInterface {
  name = 'CreateCarts1738200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash CHAR(64),
        user_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_token_hash ON carts(token_hash) WHERE token_hash IS NOT NULL;`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_user_id ON carts(user_id) WHERE user_id IS NOT NULL;`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT cart_items_quantity_check CHECK (quantity > 0),
        CONSTRAINT uq_cart_items_cart_product UNIQUE (cart_id, product_id),
        CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS cart_items CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS carts CASCADE;`);
  }
}
