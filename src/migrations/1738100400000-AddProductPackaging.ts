import { MigrationInterface, QueryRunner } from 'typeorm';

/** Quy cách sản phẩm: loại đóng gói + số lượng, một dòng cố định trên mỗi sản phẩm. */
export class AddProductPackaging1738100400000 implements MigrationInterface {
  name = 'AddProductPackaging1738100400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "packaging_type" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "packaging_quantity" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "packaging_quantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "packaging_type"`,
    );
  }
}
