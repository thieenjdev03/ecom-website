import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly repository: Repository<AuditLog>) {}

  async findAll(query: QueryAuditLogDto) {
    const { page = 1, limit = 20 } = query;
    const builder = this.repository
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC')
      .addOrderBy('log.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.action) builder.andWhere('log.action = :action', { action: query.action });
    if (query.entity) builder.andWhere('log.entity = :entity', { entity: query.entity });
    if (query.entityId) builder.andWhere('log.entity_id = :entityId', { entityId: query.entityId });
    if (query.userId) builder.andWhere('log.user_id = :userId', { userId: query.userId });
    if (query.from) builder.andWhere('log.created_at >= :from', { from: query.from });
    if (query.to) builder.andWhere('log.created_at <= :to', { to: query.to });

    const [data, total] = await builder.getManyAndCount();
    return { data, total, page, limit };
  }
}
