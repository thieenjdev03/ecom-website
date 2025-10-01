import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductsDefaults1759231075730 implements MigrationInterface {
    name = 'ProductsDefaults1759231075730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_options" DROP CONSTRAINT "FK_96d8f73d05e681974c07b99ee5d"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "optionId"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "position"`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "position" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "optionId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD CONSTRAINT "FK_96d8f73d05e681974c07b99ee5d" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_options" DROP CONSTRAINT "FK_96d8f73d05e681974c07b99ee5d"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "optionId"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "position"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "position" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "optionId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD CONSTRAINT "FK_96d8f73d05e681974c07b99ee5d" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
