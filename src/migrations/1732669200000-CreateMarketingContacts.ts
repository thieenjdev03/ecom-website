import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketingContacts1732669200000 implements MigrationInterface {
  name = 'CreateMarketingContacts1732669200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "marketing_contacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "userId" character varying(255),
        "source" character varying(50) NOT NULL DEFAULT 'modal',
        "subscribed" boolean NOT NULL DEFAULT true,
        "unsubscribedAt" TIMESTAMP WITH TIME ZONE,
        "tags" jsonb DEFAULT '[]'::jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketing_contacts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_marketing_contacts_email" ON "marketing_contacts" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_contacts_subscribed" ON "marketing_contacts" ("subscribed")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_contacts_source" ON "marketing_contacts" ("source")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_contacts_source"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_contacts_subscribed"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_contacts_email"`);
    await queryRunner.query(`DROP TABLE "marketing_contacts"`);
  }
}

