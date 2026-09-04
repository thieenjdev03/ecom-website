import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowVideoOnlyHomepageBanners1739500000000 implements MigrationInterface {
  name = 'AllowVideoOnlyHomepageBanners1739500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "homepage_banners" ALTER COLUMN "image_url" DROP NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE "homepage_banners" SET "image_url" = \'\' WHERE "image_url" IS NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "homepage_banners" ALTER COLUMN "image_url" SET NOT NULL',
    );
  }
}
