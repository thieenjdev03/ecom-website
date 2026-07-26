import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHomepageBanners1737700000000 implements MigrationInterface {
  name = 'CreateHomepageBanners1737700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE homepage_banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        link_url VARCHAR(500),
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_homepage_banners_active_order
        ON homepage_banners(is_active, display_order)
        WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_homepage_banners_updated_at BEFORE UPDATE ON homepage_banners
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS homepage_banners CASCADE;`);
  }
}
