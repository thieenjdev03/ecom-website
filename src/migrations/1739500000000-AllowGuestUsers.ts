import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enables guest checkout: an order placed without login gets linked to a
 * lightweight "guest" User row (no email, no password) keyed by phone number,
 * so the order/address FK constraints stay intact without schema changes on
 * `orders`/`addresses`. See NOTES-address-trace.md-style rationale — guest
 * users are just User rows with passwordHash IS NULL until claimed.
 *
 * phoneNumber is backfilled to a canonical digits-only form ("0909..." and
 * "+84909..." both become "84909...") so guest lookups and existing accounts
 * resolve to the same row, then enforced unique (partial: only non-empty
 * numbers) so concurrent guest checkouts can't create duplicate rows for the
 * same phone.
 */
export class AllowGuestUsers1739500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Guest accounts have no email/password yet ---
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "passwordHash" DROP NOT NULL;`);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isGuest" boolean NOT NULL DEFAULT false;
    `);

    // --- Canonicalize phoneNumber (digits only, leading "0" -> "84") ---
    await queryRunner.query(`
      UPDATE "user"
      SET "phoneNumber" = CASE
        WHEN regexp_replace("phoneNumber", '\\D', '', 'g') LIKE '84%'
          THEN regexp_replace("phoneNumber", '\\D', '', 'g')
        WHEN regexp_replace("phoneNumber", '\\D', '', 'g') LIKE '0%'
          THEN '84' || substring(regexp_replace("phoneNumber", '\\D', '', 'g') from 2)
        ELSE regexp_replace("phoneNumber", '\\D', '', 'g')
      END
      WHERE "phoneNumber" IS NOT NULL AND "phoneNumber" <> '';
    `);

    // --- Safeguard: normalization may collide existing accounts (e.g. "0909x"
    // and "+84909x" both present as separate rows). Null out phoneNumber on
    // all but the most recently updated row per canonical number so the
    // unique index below can be created; the older accounts keep everything
    // except the phone digits, which the customer can re-enter. ---
    await queryRunner.query(`
      UPDATE "user" u
      SET "phoneNumber" = NULL
      FROM (
        SELECT "id",
               row_number() OVER (
                 PARTITION BY "phoneNumber"
                 ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
               ) AS rn
        FROM "user"
        WHERE "phoneNumber" IS NOT NULL AND "phoneNumber" <> ''
      ) d
      WHERE u."id" = d."id" AND d.rn > 1;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_phone_number"
        ON "user" ("phoneNumber")
        WHERE "phoneNumber" IS NOT NULL AND "phoneNumber" <> '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_user_phone_number";`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "isGuest";`);
    // NOT NULL / phoneNumber format are not restored: guest rows created
    // under this migration may already violate them.
  }
}
