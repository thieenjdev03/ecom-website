import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueRegistrationIdentifiers1740200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Fail on existing duplicates; never delete or overwrite customer identifiers.
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_email_normalized" ON "user" (lower(trim(email))) WHERE email IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_phone_normalized" ON "user" ((CASE
      WHEN regexp_replace("phoneNumber", '[^0-9]', '', 'g') LIKE '0%'
      THEN '84' || substring(regexp_replace("phoneNumber", '[^0-9]', '', 'g') from 2)
      ELSE regexp_replace("phoneNumber", '[^0-9]', '', 'g') END))
      WHERE "phoneNumber" IS NOT NULL AND regexp_replace("phoneNumber", '[^0-9]', '', 'g') <> ''`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "UQ_user_phone_normalized"');
    await queryRunner.query('DROP INDEX IF EXISTS "UQ_user_email_normalized"');
  }
}
