import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactForPriceToProducts1738900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE products ALTER COLUMN price DROP NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS is_contact_for_price BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // A non-null value is required before restoring the old database constraint.
    await queryRunner.query(`UPDATE products SET price = 0 WHERE price IS NULL`);
    await queryRunner.query(`ALTER TABLE products ALTER COLUMN price SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS is_contact_for_price`);
  }
}
