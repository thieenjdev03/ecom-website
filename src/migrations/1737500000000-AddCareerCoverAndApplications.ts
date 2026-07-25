import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCareerCoverAndApplications1737500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE careers ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500);`);

    await queryRunner.query(`
      CREATE TABLE career_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        cover_letter TEXT,
        cv_url VARCHAR(500) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_career_applications_career ON career_applications(career_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS career_applications CASCADE;`);
    await queryRunner.query(`ALTER TABLE careers DROP COLUMN IF EXISTS cover_url;`);
  }
}
