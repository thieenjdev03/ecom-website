import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCollectionsAndProductCollections1733673600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create collections table
    await queryRunner.query(`
      CREATE TABLE collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        banner_image_url VARCHAR(500),
        seo_title VARCHAR(255),
        seo_description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for collections
    await queryRunner.query(`
      CREATE INDEX idx_collections_slug ON collections(slug);
      CREATE INDEX idx_collections_active ON collections(is_active) WHERE is_active = true;
      CREATE INDEX idx_collections_created_at_id ON collections(created_at DESC, id DESC);
    `);

    // Create product_collections junction table
    await queryRunner.query(`
      CREATE TABLE product_collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL,
        collection_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_product_collections_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT fk_product_collections_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        CONSTRAINT uq_product_collection UNIQUE (product_id, collection_id)
      );
    `);

    // Create indexes for product_collections
    await queryRunner.query(`
      CREATE INDEX idx_product_collections_product_id ON product_collections(product_id);
      CREATE INDEX idx_product_collections_collection_id ON product_collections(collection_id);
      CREATE INDEX idx_product_collections_collection_product ON product_collections(collection_id, product_id);
    `);

    // Add trigger for collections updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create index on products for cursor pagination (if not exists)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_created_at_id ON products(created_at DESC, id DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS product_collections CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS collections CASCADE;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_created_at_id;`);
  }
}

