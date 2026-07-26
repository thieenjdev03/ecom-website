import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePolicies1737800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(280) NOT NULL,
        content TEXT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_policies_slug ON policies(slug);
      CREATE INDEX idx_policies_active_order ON policies(is_active, display_order);
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS policies CASCADE;`);
  }
}
