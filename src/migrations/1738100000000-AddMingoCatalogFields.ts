import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMingoCatalogFields1738100000000
  implements MigrationInterface
{
  name = 'AddMingoCatalogFields1738100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS weight_grams INTEGER,
      ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS allergens JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS nutrition JSONB;
    `);
    await queryRunner.query(`
      ALTER TABLE collections
      ADD COLUMN IF NOT EXISTS mobile_banner_image_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS cta_label VARCHAR(100),
      ADD COLUMN IF NOT EXISTS placement VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
      ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
    `);
    await queryRunner.query(`
      ALTER TABLE collections
      DROP CONSTRAINT IF EXISTS chk_collections_placement;
    `);
    await queryRunner.query(`
      ALTER TABLE collections
      ADD CONSTRAINT chk_collections_placement
      CHECK (placement IN ('HERO', 'HOME_SECTION', 'NORMAL'));
    `);
    await queryRunner.query(`
      UPDATE products
      SET weight_grams = ROUND(weight * 1000)
      WHERE weight_grams IS NULL AND weight IS NOT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS chk_products_weight_grams;
    `);
    await queryRunner.query(`
      ALTER TABLE products
      ADD CONSTRAINT chk_products_weight_grams
      CHECK (weight_grams IS NULL OR weight_grams > 0);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_collections_storefront_placement
      ON collections (placement, sort_order)
      WHERE is_active = true;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_collections_storefront_placement;',
    );
    await queryRunner.query(
      'ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_weight_grams;',
    );
    await queryRunner.query(
      'ALTER TABLE products DROP COLUMN IF EXISTS weight_grams;',
    );
    await queryRunner.query(
      'ALTER TABLE collections DROP CONSTRAINT IF EXISTS chk_collections_placement;',
    );
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS nutrition,
      DROP COLUMN IF EXISTS allergens,
      DROP COLUMN IF EXISTS compare_at_price;
    `);
    await queryRunner.query(`
      ALTER TABLE collections
      DROP COLUMN IF EXISTS sort_order,
      DROP COLUMN IF EXISTS placement,
      DROP COLUMN IF EXISTS cta_label,
      DROP COLUMN IF EXISTS mobile_banner_image_url;
    `);
  }
}
