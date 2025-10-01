import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductsDefaults1759294021200 implements MigrationInterface {
    name = 'ProductsDefaults1759294021200'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_options" DROP CONSTRAINT "FK_df6bae456c40d4b6e01ec20fefb"`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "status" character varying NOT NULL DEFAULT 'published', "defaultVariantId" uuid, "price" numeric(12,2) NOT NULL DEFAULT '0', "priceOriginal" numeric(12,2) NOT NULL DEFAULT '0', "attribute" character varying NOT NULL DEFAULT '', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d3de7d46e450e804d74067519a" ON "products" ("status", "updatedAt") `);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "position"`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "position" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_f515690c571a03400a9876600b5" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD CONSTRAINT "FK_96d8f73d05e681974c07b99ee5d" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD CONSTRAINT "FK_df6bae456c40d4b6e01ec20fefb" FOREIGN KEY ("optionId") REFERENCES "options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_media" ADD CONSTRAINT "FK_50e3945c6150d80b69b5f18515a" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_media" DROP CONSTRAINT "FK_50e3945c6150d80b69b5f18515a"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP CONSTRAINT "FK_df6bae456c40d4b6e01ec20fefb"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP CONSTRAINT "FK_96d8f73d05e681974c07b99ee5d"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_f515690c571a03400a9876600b5"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "position"`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "position" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3de7d46e450e804d74067519a"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD CONSTRAINT "FK_df6bae456c40d4b6e01ec20fefb" FOREIGN KEY ("optionId") REFERENCES "options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
