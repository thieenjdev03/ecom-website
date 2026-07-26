import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHomepageSectionToCollections1737700100000 implements MigrationInterface {
  name = 'AddHomepageSectionToCollections1737700100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collections"
      ADD COLUMN IF NOT EXISTS "homepage_section" VARCHAR(50);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_collections_homepage_section
        ON collections(homepage_section)
        WHERE homepage_section IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_collections_homepage_section;`);
    await queryRunner.query(`
      ALTER TABLE "collections"
      DROP COLUMN IF EXISTS "homepage_section";
    `);
  }
}
