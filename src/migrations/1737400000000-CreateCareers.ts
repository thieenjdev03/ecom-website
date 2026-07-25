import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCareers1737400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE careers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(280) UNIQUE NOT NULL,
        category VARCHAR(100),
        location VARCHAR(100),
        level VARCHAR(50),
        content TEXT NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE TABLE career_relations (
        parent_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
        child_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
        sort_order INT NOT NULL DEFAULT 0,
        PRIMARY KEY (parent_id, child_id),
        CHECK (parent_id <> child_id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_careers_status ON careers(status) WHERE deleted_at IS NULL;
      CREATE INDEX idx_careers_is_primary ON careers(is_primary) WHERE deleted_at IS NULL;
      CREATE INDEX idx_careers_category ON careers(category);
      CREATE INDEX idx_careers_created_at_id ON careers(created_at DESC, id DESC);
      CREATE INDEX idx_career_relations_parent ON career_relations(parent_id);
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_careers_updated_at BEFORE UPDATE ON careers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS career_relations CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS careers CASCADE;`);
  }
}
