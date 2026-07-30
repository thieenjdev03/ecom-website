import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductNutritionInformation1738100000000 implements MigrationInterface {
  name = 'AddProductNutritionInformation1738100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS nutrition_information JSONB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS nutrition_information
    `);
  }
}
