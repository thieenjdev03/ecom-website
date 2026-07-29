import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMingoCarts1738100150000 implements MigrationInterface {
  name = 'CreateMingoCarts1738100150000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash CHAR(64),
        user_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_carts_user
          FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_token_hash
      ON carts(token_hash) WHERE token_hash IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_user_id
      ON carts(user_id) WHERE user_id IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_cart_items_cart_product UNIQUE (cart_id, product_id)
      );
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS cart_items;');
    await queryRunner.query('DROP TABLE IF EXISTS carts;');
  }
}
