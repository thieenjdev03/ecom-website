import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInactiveStatusToProducts1705000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find and drop the existing CHECK constraint (PostgreSQL auto-generates constraint names)
    // The constraint name is typically: products_status_check or similar
    const constraintResult = await queryRunner.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'products'::regclass 
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%status%IN%';
    `);

    if (constraintResult.length > 0) {
      const constraintName = constraintResult[0].conname;
      // Use parameterized query to safely drop constraint
      await queryRunner.query(`
        ALTER TABLE products 
        DROP CONSTRAINT IF EXISTS "${constraintName}";
      `);
    }

    // Add new CHECK constraint that includes 'inactive'
    await queryRunner.query(`
      ALTER TABLE products 
      ADD CONSTRAINT products_status_check 
      CHECK (status IN ('active', 'inactive', 'draft', 'out_of_stock', 'discontinued'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new constraint
    await queryRunner.query(`
      ALTER TABLE products 
      DROP CONSTRAINT IF EXISTS products_status_check;
    `);

    // Restore original constraint
    await queryRunner.query(`
      ALTER TABLE products 
      ADD CONSTRAINT products_status_check 
      CHECK (status IN ('active', 'draft', 'out_of_stock', 'discontinued'));
    `);
  }
}

