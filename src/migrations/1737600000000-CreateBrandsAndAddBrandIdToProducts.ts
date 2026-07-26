import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBrandsAndAddBrandIdToProducts1737600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create brands table
    await queryRunner.query(`
      CREATE TABLE brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(280) UNIQUE NOT NULL,
        logo_url VARCHAR(500),
        description TEXT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // Create indexes for brands
    await queryRunner.query(`
      CREATE INDEX idx_brands_slug ON brands(slug);
      CREATE INDEX idx_brands_active ON brands(is_active) WHERE is_active = true;
    `);

    // Add trigger for brands updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Add brand_id column to products
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE products ADD CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_products_brand_id ON products(brand_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_brand_id;`);
    await queryRunner.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_brand;`);
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS brand_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS brands CASCADE;`);
  }
}
