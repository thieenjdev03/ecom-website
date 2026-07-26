import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDistributors1737700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE distributors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(280) NOT NULL,
        address_line VARCHAR(255) NOT NULL,
        district_text VARCHAR(120),
        ward_code VARCHAR(12) NOT NULL,
        ward_name VARCHAR(120) NOT NULL,
        province_code VARCHAR(4) NOT NULL,
        province_name VARCHAR(120) NOT NULL,
        description TEXT,
        maps_embed_src TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_distributors_slug ON distributors(slug);
      CREATE INDEX idx_distributors_province_code ON distributors(province_code);
      CREATE INDEX idx_distributors_ward_code ON distributors(ward_code);
      CREATE INDEX idx_distributors_is_active ON distributors(is_active);
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_distributors_updated_at BEFORE UPDATE ON distributors
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TABLE distributor_categories (
        distributor_id UUID NOT NULL,
        category_id UUID NOT NULL,
        PRIMARY KEY (distributor_id, category_id),
        CONSTRAINT fk_distributor_categories_distributor FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE,
        CONSTRAINT fk_distributor_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE distributor_collections (
        distributor_id UUID NOT NULL,
        collection_id UUID NOT NULL,
        PRIMARY KEY (distributor_id, collection_id),
        CONSTRAINT fk_distributor_collections_distributor FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE,
        CONSTRAINT fk_distributor_collections_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_distributor_categories_category_id ON distributor_categories(category_id);
      CREATE INDEX idx_distributor_collections_collection_id ON distributor_collections(collection_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS distributor_categories CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS distributor_collections CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS distributors CASCADE;`);
  }
}
