import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Switches the catalog (products, brands, careers, policies, homepage banners)
 * from soft delete to force/hard delete.
 *
 * Previously these entities used @DeleteDateColumn, so a "deleted" row stayed in
 * the table with its slug still occupying the unique constraint. Creating a new
 * record that reused a deleted record's slug then failed with a duplicate-slug
 * error even though the item appeared gone from the UI.
 *
 * The services now hard-delete. This migration purges the rows that were already
 * soft-deleted so those leftover slugs become available again.
 *
 * The `deleted_at` columns are intentionally left in place (harmless once no row
 * ever has them set) to avoid a destructive schema change and to keep the DB
 * compatible with any environment that still lists these migrations.
 *
 * NOTE: down() cannot resurrect hard-deleted rows, so it is a no-op.
 */
export class PurgeSoftDeletedCatalogRows1738800000000 implements MigrationInterface {
  private static readonly TABLES = [
    'products',
    'brands',
    'careers',
    'policies',
    'homepage_banners',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of PurgeSoftDeletedCatalogRows1738800000000.TABLES) {
      // Only purge when the table + deleted_at column actually exist, so the
      // migration stays safe across environments with drifted schemas.
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = '${table}' AND column_name = 'deleted_at'
          ) THEN
            EXECUTE 'DELETE FROM "${table}" WHERE "deleted_at" IS NOT NULL';
          END IF;
        END $$;
      `);
    }
  }

  public async down(): Promise<void> {
    // Hard-deleted rows cannot be restored.
  }
}
