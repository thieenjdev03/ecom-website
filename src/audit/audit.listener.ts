import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AUDIT_EVENT, AuditAction } from './audit.constants';
import { AuditDiff, AuditLog } from './audit-log.entity';

type AuditPayload = {
  action: AuditAction;
  entity: string;
  entityId: string | null;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  diff: AuditDiff | null;
  createdAt: Date;
};

@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  constructor(@InjectRepository(AuditLog) private readonly repository: Repository<AuditLog>) {}

  @OnEvent(AUDIT_EVENT, { async: true })
  async handle(payload: AuditPayload) {
    try {
      await this.repository.insert(payload);
    } catch (error) {
      this.logger.error(`Failed to persist audit log: ${error instanceof Error ? error.message : error}`);
    }
  }
}
