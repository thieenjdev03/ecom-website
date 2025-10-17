import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPasswordColumn1702000000000 implements MigrationInterface {
  name = 'DropPasswordColumn1702000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Support both possible table names depending on naming strategy
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN IF EXISTS "password"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore column if needed
    await queryRunner.query('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password" character varying');
  }
}


