import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AuditAction } from './audit.constants';

export type AuditDiff = Record<string, { old: unknown; new: unknown }>;

@Entity('audit_logs')
@Index('idx_audit_logs_created_at', ['createdAt'])
@Index('idx_audit_logs_entity', ['entity', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  action: AuditAction;

  @Column({ length: 100 })
  entity: string;

  @Column({ name: 'entity_id', length: 255, nullable: true })
  entityId: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: Record<string, unknown> | null;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  diff: AuditDiff | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
