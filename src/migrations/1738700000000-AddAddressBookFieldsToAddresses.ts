import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Extends the existing `addresses` table into a full address book (sổ địa chỉ):
 *  - denormalized 2-level VN geo ids (provinceId / wardId) alongside the existing
 *    name columns (province / ward),
 *  - a dedupeKey to make checkout auto-save idempotent,
 *  - soft delete (deletedAt),
 *  - partial unique indexes enforcing "one default per user" and "no duplicate
 *    address per user" at the DB level.
 *
 * See NOTES-address-trace.md for the field mapping and why we extend `addresses`
 * instead of creating a new `user_address` table.
 */
export class AddAddressBookFieldsToAddresses1738700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- New columns (idempotent) ---
    await queryRunner.query(`
      ALTER TABLE "addresses"
        ADD COLUMN IF NOT EXISTS "provinceId" varchar(20) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "wardId"     varchar(20) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "dedupeKey"  varchar(64),
        ADD COLUMN IF NOT EXISTS "deletedAt"  timestamp;
    `);

    // --- Widen reused columns to the address-book sizes (safe widenings) ---
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "recipientName" TYPE varchar(160);`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "province" TYPE varchar(160);`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "ward" TYPE varchar(160);`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "label" TYPE varchar(60);`);

    // --- Backfill dedupeKey for existing rows (matches buildAddressDedupeKey) ---
    // norm(x) = collapse internal whitespace of lower(btrim(x)); phone = digits only.
    await queryRunner.query(`
      UPDATE "addresses"
      SET "dedupeKey" = md5(
        regexp_replace(lower(btrim(coalesce("recipientName", ''))), '\\s+', ' ', 'g')
        || '|' || regexp_replace(coalesce("recipientPhone", ''), '\\D', '', 'g')
        || '|' || coalesce("provinceId", '')
        || '|' || coalesce("wardId", '')
        || '|' || regexp_replace(lower(btrim(coalesce("streetLine1", ''))), '\\s+', ' ', 'g')
      )
      WHERE "dedupeKey" IS NULL AND "deletedAt" IS NULL;
    `);

    // --- Safeguard: collapse accidental duplicate active addresses so the unique
    // dedupe index can be created. Keep the most recently updated per group. ---
    await queryRunner.query(`
      UPDATE "addresses" a
      SET "deletedAt" = now()
      FROM (
        SELECT "id",
               row_number() OVER (
                 PARTITION BY "userId", "dedupeKey"
                 ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
               ) AS rn
        FROM "addresses"
        WHERE "deletedAt" IS NULL AND "dedupeKey" IS NOT NULL
      ) d
      WHERE a."id" = d."id" AND d.rn > 1;
    `);

    // --- Safeguard: at most one isDefault=true per user among active rows. ---
    await queryRunner.query(`
      UPDATE "addresses" a
      SET "isDefault" = false
      FROM (
        SELECT "id",
               row_number() OVER (
                 PARTITION BY "userId"
                 ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
               ) AS rn
        FROM "addresses"
        WHERE "deletedAt" IS NULL AND "isDefault" = true
      ) d
      WHERE a."id" = d."id" AND d.rn > 1;
    `);

    // --- Indexes ---
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_addresses_user_active"
        ON "addresses" ("userId") WHERE "deletedAt" IS NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_addresses_one_default"
        ON "addresses" ("userId")
        WHERE "isDefault" = true AND "deletedAt" IS NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_addresses_dedupe"
        ON "addresses" ("userId", "dedupeKey")
        WHERE "deletedAt" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_addresses_dedupe";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_addresses_one_default";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_addresses_user_active";`);

    await queryRunner.query(`
      ALTER TABLE "addresses"
        DROP COLUMN IF EXISTS "deletedAt",
        DROP COLUMN IF EXISTS "dedupeKey",
        DROP COLUMN IF EXISTS "wardId",
        DROP COLUMN IF EXISTS "provinceId";
    `);

    // Revert column widenings (existing data fit the original widths).
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "label" TYPE varchar(40);`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "ward" TYPE varchar(120);`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "province" TYPE varchar(120);`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "recipientName" TYPE varchar(120);`);
  }
}
