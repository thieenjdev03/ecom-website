import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1739200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        action VARCHAR(20) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255),
        user_id UUID,
        ip VARCHAR(100),
        user_agent TEXT,
        old_value JSONB,
        new_value JSONB,
        diff JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id, created_at)
      ) PARTITION BY RANGE (created_at);
    `);

    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    // Keep a rolling two-year runway of monthly partitions. Retention can drop
    // partitions older than 12 months when the cleanup job is introduced.
    for (let index = 0; index < 24; index += 1) {
      const from = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
      const to = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index + 1, 1));
      const name = `audit_logs_${from.getUTCFullYear()}_${String(from.getUTCMonth() + 1).padStart(2, '0')}`;
      await queryRunner.query(`
        CREATE TABLE ${name} PARTITION OF audit_logs
        FOR VALUES FROM ('${from.toISOString()}') TO ('${to.toISOString()}');
      `);
    }

    // Prevent writes from failing after the pre-created runway is exhausted.
    await queryRunner.query(`CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_entity ON audit_logs (entity, entity_id);`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_user_created_at ON audit_logs (user_id, created_at DESC);`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_entity_id ON audit_logs (entity, entity_id, created_at DESC);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs CASCADE;`);
  }
}
