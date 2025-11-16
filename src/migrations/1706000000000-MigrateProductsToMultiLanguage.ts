import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateProductsToMultiLanguage1706000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new JSONB columns (nullable first)
    await queryRunner.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS name_new JSONB,
      ADD COLUMN IF NOT EXISTS slug_new JSONB,
      ADD COLUMN IF NOT EXISTS description_new JSONB,
      ADD COLUMN IF NOT EXISTS short_description_new JSONB,
      ADD COLUMN IF NOT EXISTS meta_title_new JSONB,
      ADD COLUMN IF NOT EXISTS meta_description_new JSONB;
    `);

    // Step 2: Migrate existing data from VARCHAR/TEXT to JSONB format
    // Convert old string values to { en: "old_value", vi: "" }
    await queryRunner.query(`
      UPDATE products 
      SET 
        name_new = jsonb_build_object('en', COALESCE(name, ''), 'vi', ''),
        slug_new = jsonb_build_object('en', COALESCE(slug, ''), 'vi', ''),
        description_new = CASE 
          WHEN description IS NOT NULL AND description != '' 
          THEN jsonb_build_object('en', description, 'vi', '')
          ELSE NULL
        END,
        short_description_new = CASE 
          WHEN short_description IS NOT NULL AND short_description != '' 
          THEN jsonb_build_object('en', short_description, 'vi', '')
          ELSE NULL
        END,
        meta_title_new = CASE 
          WHEN meta_title IS NOT NULL AND meta_title != '' 
          THEN jsonb_build_object('en', meta_title, 'vi', '')
          ELSE NULL
        END,
        meta_description_new = CASE 
          WHEN meta_description IS NOT NULL AND meta_description != '' 
          THEN jsonb_build_object('en', meta_description, 'vi', '')
          ELSE NULL
        END;
    `);

    // Step 3: Migrate variants.name from string to JSONB
    // Update variants array: convert each variant's name from string to { en: "old_value", vi: "" }
    await queryRunner.query(`
      UPDATE products
      SET variants = (
        SELECT jsonb_agg(
          CASE 
            WHEN variant ? 'name' AND jsonb_typeof(variant->'name') = 'string'
            THEN jsonb_set(variant, '{name}', jsonb_build_object('en', variant->>'name', 'vi', ''))
            ELSE variant
          END
        )
        FROM jsonb_array_elements(variants) AS variant
      )
      WHERE variants IS NOT NULL AND jsonb_array_length(variants) > 0;
    `);

    // Step 4: Drop old columns
    await queryRunner.query(`
      ALTER TABLE products 
      DROP COLUMN IF EXISTS name,
      DROP COLUMN IF EXISTS slug,
      DROP COLUMN IF EXISTS description,
      DROP COLUMN IF EXISTS short_description,
      DROP COLUMN IF EXISTS meta_title,
      DROP COLUMN IF EXISTS meta_description;
    `);

    // Step 5: Rename new columns to original names (PostgreSQL requires separate statements)
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN name_new TO name;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN slug_new TO slug;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN description_new TO description;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN short_description_new TO short_description;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN meta_title_new TO meta_title;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN meta_description_new TO meta_description;`);

    // Step 6: Set NOT NULL constraints for required fields
    await queryRunner.query(`
      ALTER TABLE products 
      ALTER COLUMN name SET NOT NULL,
      ALTER COLUMN slug SET NOT NULL;
    `);

    // Step 7: Recreate unique constraint on slug (now JSONB)
    // Note: We can't have a simple UNIQUE on JSONB, so we'll create a unique index on slug->>'en'
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_en 
      ON products ((slug->>'en'))
      WHERE slug->>'en' IS NOT NULL AND slug->>'en' != '';
    `);

    // Also create index for Vietnamese slug
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_slug_vi 
      ON products ((slug->>'vi'))
      WHERE slug->>'vi' IS NOT NULL AND slug->>'vi' != '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add back VARCHAR/TEXT columns
    await queryRunner.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS name_old VARCHAR(255),
      ADD COLUMN IF NOT EXISTS slug_old VARCHAR(255),
      ADD COLUMN IF NOT EXISTS description_old TEXT,
      ADD COLUMN IF NOT EXISTS short_description_old VARCHAR(500),
      ADD COLUMN IF NOT EXISTS meta_title_old VARCHAR(255),
      ADD COLUMN IF NOT EXISTS meta_description_old VARCHAR(500);
    `);

    // Step 2: Migrate data back from JSONB to VARCHAR/TEXT (extract 'en' value)
    await queryRunner.query(`
      UPDATE products 
      SET 
        name_old = COALESCE(name->>'en', ''),
        slug_old = COALESCE(slug->>'en', ''),
        description_old = description->>'en',
        short_description_old = short_description->>'en',
        meta_title_old = meta_title->>'en',
        meta_description_old = meta_description->>'en';
    `);

    // Step 3: Migrate variants.name back from JSONB to string
    await queryRunner.query(`
      UPDATE products
      SET variants = (
        SELECT jsonb_agg(
          CASE 
            WHEN variant ? 'name' AND jsonb_typeof(variant->'name') = 'object'
            THEN jsonb_set(variant, '{name}', to_jsonb(COALESCE(variant->'name'->>'en', '')))
            ELSE variant
          END
        )
        FROM jsonb_array_elements(variants) AS variant
      )
      WHERE variants IS NOT NULL AND jsonb_array_length(variants) > 0;
    `);

    // Step 4: Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_slug_en;
      DROP INDEX IF EXISTS idx_products_slug_vi;
    `);

    // Step 5: Drop JSONB columns
    await queryRunner.query(`
      ALTER TABLE products 
      DROP COLUMN IF EXISTS name,
      DROP COLUMN IF EXISTS slug,
      DROP COLUMN IF EXISTS description,
      DROP COLUMN IF EXISTS short_description,
      DROP COLUMN IF EXISTS meta_title,
      DROP COLUMN IF EXISTS meta_description;
    `);

    // Step 6: Rename old columns back (PostgreSQL requires separate statements)
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN name_old TO name;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN slug_old TO slug;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN description_old TO description;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN short_description_old TO short_description;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN meta_title_old TO meta_title;`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN meta_description_old TO meta_description;`);

    // Step 7: Set NOT NULL and recreate unique constraint
    await queryRunner.query(`
      ALTER TABLE products 
      ALTER COLUMN name SET NOT NULL,
      ALTER COLUMN slug SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE products 
      ADD CONSTRAINT products_slug_key UNIQUE (slug);
    `);
  }
}

