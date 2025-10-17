import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsAndCategories1703000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes for categories
    await queryRunner.query(`
      CREATE INDEX idx_categories_slug ON categories(slug);
      CREATE INDEX idx_categories_parent ON categories(parent_id);
      CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        sale_price DECIMAL(10,2) CHECK (sale_price >= 0 AND sale_price <= price),
        cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
        
        images JSONB DEFAULT '[]'::jsonb,
        variants JSONB DEFAULT '[]'::jsonb,
        
        stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        
        category_id INT REFERENCES categories(id) ON DELETE SET NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'out_of_stock', 'discontinued')),
        is_featured BOOLEAN DEFAULT false,
        
        meta_title VARCHAR(255),
        meta_description VARCHAR(500),
        
        weight DECIMAL(8,2),
        dimensions JSONB,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // Indexes for products
    await queryRunner.query(`
      CREATE INDEX idx_products_slug ON products(slug) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true AND deleted_at IS NULL;
      CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, ''))) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_tags ON products USING GIN(tags) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_variants ON products USING GIN(variants) WHERE deleted_at IS NULL;
    `);

    // Auto-update trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS products CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories CASCADE;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;`);
  }
}
