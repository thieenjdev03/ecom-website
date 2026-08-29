import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactMessages1739300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE contact_messages (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "fullName" VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        department VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notified BOOLEAN NOT NULL DEFAULT FALSE,
        ip VARCHAR(100),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_contact_messages_created_at ON contact_messages ("createdAt" DESC);`);
    // Dò nhanh các liên hệ chưa gửi được mail thông báo.
    await queryRunner.query(`CREATE INDEX idx_contact_messages_notified ON contact_messages (notified) WHERE notified = FALSE;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS contact_messages;`);
  }
}
