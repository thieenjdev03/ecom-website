import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVariantAttributes1759295000000 implements MigrationInterface {
  name = 'AddVariantAttributes1759295000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variants" ADD COLUMN "attributes" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "attributes"`);
  }
}


