import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductNotes1738400000000 implements MigrationInterface {
  name = 'AddProductNotes1738400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "notes" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "notes"`);
  }
}
