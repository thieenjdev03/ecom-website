import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlToColors1732669300000 implements MigrationInterface {
  name = 'AddImageUrlToColors1732669300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "colors" 
      ADD COLUMN IF NOT EXISTS "image_url" TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "colors" 
      DROP COLUMN IF EXISTS "image_url";
    `);
  }
}

