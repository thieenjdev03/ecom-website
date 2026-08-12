import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVariantSkuToCartItems1738600000000 implements MigrationInterface {
  name = 'AddVariantSkuToCartItems1738600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_sku VARCHAR(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS uq_cart_items_cart_product`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_cart_product_variant
       ON cart_items (cart_id, product_id, COALESCE(variant_sku, ''))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS uq_cart_items_cart_product_variant`,
    );
    await queryRunner.query(
      `ALTER TABLE cart_items ADD CONSTRAINT uq_cart_items_cart_product UNIQUE (cart_id, product_id)`,
    );
    await queryRunner.query(
      `ALTER TABLE cart_items DROP COLUMN IF EXISTS variant_sku`,
    );
  }
}
