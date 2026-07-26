import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackagingFieldsToSizes1737900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Reuse `sizes` as packaging/quy cách for ice cream. All new columns nullable
    // so existing clothing sizes (S/M/L) are untouched.
    await queryRunner.query(`ALTER TABLE sizes ALTER COLUMN name TYPE VARCHAR(100);`);
    await queryRunner.query(`ALTER TABLE sizes ADD COLUMN IF NOT EXISTS unit VARCHAR(20);`);
    await queryRunner.query(`ALTER TABLE sizes ADD COLUMN IF NOT EXISTS pack_qty INT;`);
    await queryRunner.query(`ALTER TABLE sizes ADD COLUMN IF NOT EXISTS volume_ml INT;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE sizes DROP COLUMN IF EXISTS volume_ml;`);
    await queryRunner.query(`ALTER TABLE sizes DROP COLUMN IF EXISTS pack_qty;`);
    await queryRunner.query(`ALTER TABLE sizes DROP COLUMN IF EXISTS unit;`);
    await queryRunner.query(`ALTER TABLE sizes ALTER COLUMN name TYPE VARCHAR(50);`);
  }
}
