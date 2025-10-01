import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPasswordColumn1701000000001 implements MigrationInterface {
  name = 'DropPasswordColumn1701000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop column if exists to be safe across environments
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "password"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "password" character varying`);
  }
}

export class EnablePgcrypto1701000000000 implements MigrationInterface {
  name = 'EnablePgcrypto1701000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no-op: keeping extension is safe
  }
}


