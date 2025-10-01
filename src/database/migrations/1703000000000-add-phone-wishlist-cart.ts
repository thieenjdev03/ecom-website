import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneWishlistCart1703000000000 implements MigrationInterface {
    name = 'AddPhoneWishlistCart1703000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_phone_numbers table
        await queryRunner.query(`
            CREATE TABLE "user_phone_numbers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "phoneNumber" character varying,
                "label" character varying CHECK ("label" IN ('home', 'work', 'other')),
                "isPrimary" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_phone_numbers" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_user_phone_userId_phoneNumber" UNIQUE ("userId", "phoneNumber"),
                CONSTRAINT "FK_user_phone_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_user_phone_userId" ON "user_phone_numbers" ("userId")`);

        // Create user_wishlist_products table
        await queryRunner.query(`
            CREATE TABLE "user_wishlist_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "productVariantId" uuid,
                "note" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_wishlist_products" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_wishlist_userId_productId_variantId" UNIQUE ("userId", "productId", "productVariantId"),
                CONSTRAINT "FK_wishlist_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_wishlist_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_wishlist_variantId" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_wishlist_userId" ON "user_wishlist_products" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_wishlist_product" ON "user_wishlist_products" ("productId", "productVariantId")`);

        // Create carts table
        await queryRunner.query(`
            CREATE TABLE "carts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid,
                "sessionId" character varying,
                "currency" character varying(3) NOT NULL DEFAULT 'VND',
                "status" character varying NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'converted', 'abandoned', 'expired')),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "expiresAt" TIMESTAMP,
                CONSTRAINT "PK_carts" PRIMARY KEY ("id"),
                CONSTRAINT "FK_carts_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_carts_userId" ON "carts" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_carts_sessionId" ON "carts" ("sessionId")`);

        // Create cart_items table
        await queryRunner.query(`
            CREATE TABLE "cart_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cartId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "productVariantId" uuid NOT NULL,
                "quantity" integer NOT NULL DEFAULT 1,
                "unitPrice" numeric(18,2) NOT NULL,
                "unitCompareAtPrice" numeric(18,2),
                "discountCode" character varying,
                "discountAmount" numeric(18,2) NOT NULL DEFAULT 0,
                "taxRate" numeric(5,4) NOT NULL DEFAULT 0,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cart_items" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_cart_items_cartId_variantId" UNIQUE ("cartId", "productVariantId"),
                CONSTRAINT "FK_cart_items_cartId" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_cart_items_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_cart_items_variantId" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_cart_items_cartId" ON "cart_items" ("cartId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop cart_items table
        await queryRunner.query(`DROP INDEX "IDX_cart_items_cartId"`);
        await queryRunner.query(`DROP TABLE "cart_items"`);

        // Drop carts table
        await queryRunner.query(`DROP INDEX "IDX_carts_sessionId"`);
        await queryRunner.query(`DROP INDEX "IDX_carts_userId"`);
        await queryRunner.query(`DROP TABLE "carts"`);

        // Drop user_wishlist_products table
        await queryRunner.query(`DROP INDEX "IDX_wishlist_product"`);
        await queryRunner.query(`DROP INDEX "IDX_wishlist_userId"`);
        await queryRunner.query(`DROP TABLE "user_wishlist_products"`);

        // Drop user_phone_numbers table
        await queryRunner.query(`DROP INDEX "IDX_user_phone_userId"`);
        await queryRunner.query(`DROP TABLE "user_phone_numbers"`);
    }
}

