import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoUrlToHomepageBanners1738500000000 implements MigrationInterface {
  name = 'AddVideoUrlToHomepageBanners1738500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "homepage_banners" ADD COLUMN IF NOT EXISTS "video_url" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "homepage_banners" DROP COLUMN IF EXISTS "video_url"`,
    );
  }
}
