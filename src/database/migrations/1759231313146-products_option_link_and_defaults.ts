import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductsOptionLinkAndDefaults1759231313146 implements MigrationInterface {
    name = 'ProductsOptionLinkAndDefaults1759231313146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "status" character varying NOT NULL DEFAULT 'published', "defaultVariantId" uuid, "price" numeric(12,2) NOT NULL DEFAULT '0', "priceOriginal" numeric(12,2) NOT NULL DEFAULT '0', "attribute" character varying NOT NULL DEFAULT '', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d3de7d46e450e804d74067519a" ON "products" ("status", "updatedAt") `);
        await queryRunner.query(`CREATE TABLE "product_variant_option_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "variantId" uuid NOT NULL, "optionValueId" uuid NOT NULL, CONSTRAINT "UQ_1f4c0b66aaacb5bca9ba30d09c4" UNIQUE ("variantId", "optionValueId"), CONSTRAINT "PK_7f68ec40e620a91b7ec2a308d23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "sku" character varying NOT NULL, "priceOriginal" numeric(12,2) NOT NULL, "priceFinal" numeric(12,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'VND', "stockOnHand" integer NOT NULL DEFAULT '0', "stockReserved" integer NOT NULL DEFAULT '0', "name" character varying, "thumbnailUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_46f236f21640f9da218a063a866" UNIQUE ("sku"), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f515690c571a03400a9876600b" ON "product_variants" ("productId") `);
        await queryRunner.query(`CREATE TABLE "product_price_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid, "variantId" uuid, "type" character varying NOT NULL DEFAULT 'percent', "value" numeric(12,2) NOT NULL, "startAt" TIMESTAMP WITH TIME ZONE, "endAt" TIMESTAMP WITH TIME ZONE, "priority" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_b176a1c205634b7eea289bb693c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "optionId" uuid NOT NULL, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_3916b02fb43aa725f8167c718e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_option_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productOptionId" uuid NOT NULL, "value" character varying NOT NULL, "hexCode" character varying, "meta" jsonb, CONSTRAINT "PK_c5ddd425048b2df1a76cb9d5226" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "url" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'image', "position" integer NOT NULL DEFAULT '0', "isPrimary" boolean NOT NULL DEFAULT false, "isHover" boolean NOT NULL DEFAULT false, "variantId" uuid, "alt" character varying, CONSTRAINT "PK_09d4639de8082a32aa27f3ac9a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3aa94cddb3000526599c02ab81" ON "product_media" ("productId", "position") `);
        await queryRunner.query(`CREATE TABLE "product_attributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "key" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "PK_4fa18fc5c893cb9894fc40ca921" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "position"`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "position" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_f515690c571a03400a9876600b5" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD CONSTRAINT "FK_96d8f73d05e681974c07b99ee5d" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD CONSTRAINT "FK_df6bae456c40d4b6e01ec20fefb" FOREIGN KEY ("optionId") REFERENCES "options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_option_values" ADD CONSTRAINT "FK_5ebdc6b14148329616c575ad2ee" FOREIGN KEY ("productOptionId") REFERENCES "product_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_media" ADD CONSTRAINT "FK_50e3945c6150d80b69b5f18515a" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_media" DROP CONSTRAINT "FK_50e3945c6150d80b69b5f18515a"`);
        await queryRunner.query(`ALTER TABLE "product_option_values" DROP CONSTRAINT "FK_5ebdc6b14148329616c575ad2ee"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP CONSTRAINT "FK_df6bae456c40d4b6e01ec20fefb"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP CONSTRAINT "FK_96d8f73d05e681974c07b99ee5d"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_f515690c571a03400a9876600b5"`);
        await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "position"`);
        await queryRunner.query(`ALTER TABLE "product_options" ADD "position" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP TABLE "product_attributes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3aa94cddb3000526599c02ab81"`);
        await queryRunner.query(`DROP TABLE "product_media"`);
        await queryRunner.query(`DROP TABLE "product_option_values"`);
        await queryRunner.query(`DROP TABLE "product_options"`);
        await queryRunner.query(`DROP TABLE "product_price_rules"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f515690c571a03400a9876600b"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
        await queryRunner.query(`DROP TABLE "product_variant_option_values"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3de7d46e450e804d74067519a"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
