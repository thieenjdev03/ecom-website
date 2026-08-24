import { EventSubscriber } from 'typeorm';
import {
  EntitySubscriberInterface,
  DataSource,
  InsertEvent,
  RemoveEvent,
  SoftRemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AUDIT_EVENT, AUDITED_ENTITIES, AuditAction, SKIP_FIELDS } from './audit.constants';
import { getAuditContext } from './audit-context';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly emitter: EventEmitter2,
  ) {
    if (!dataSource.subscribers.includes(this)) {
      dataSource.subscribers.push(this);
    }
  }

  afterInsert(event: InsertEvent<unknown>) {
    if (!this.isAudited(event.metadata.name)) return;
    this.enqueue('CREATE', event.metadata.name, this.entityId(event.entity), null, event.entity, null);
  }

  afterUpdate(event: UpdateEvent<unknown>) {
    if (!this.isAudited(event.metadata.name)) return;

    const diff: Record<string, { old: unknown; new: unknown }> = {};
    for (const column of event.updatedColumns) {
      const field = column.propertyName;
      if (SKIP_FIELDS.has(field)) continue;

      const oldValue = this.normalise(event.databaseEntity?.[field]);
      const newValue = this.normalise(event.entity?.[field]);
      if (!this.sameValue(oldValue, newValue)) {
        diff[field] = { old: oldValue, new: newValue };
      }
    }

    if (!Object.keys(diff).length) return;
    this.enqueue(
      'UPDATE',
      event.metadata.name,
      this.entityId(event.entity) ?? this.entityId(event.databaseEntity),
      event.databaseEntity,
      event.entity,
      diff,
    );
  }

  afterRemove(event: RemoveEvent<unknown>) {
    if (!this.isAudited(event.metadata.name)) return;
    this.enqueue('DELETE', event.metadata.name, this.entityId(event.databaseEntity) ?? event.entityId, event.databaseEntity, null, null);
  }

  afterSoftRemove(event: SoftRemoveEvent<unknown>) {
    if (!this.isAudited(event.metadata.name)) return;
    this.enqueue('DELETE', event.metadata.name, this.entityId(event.entity) ?? event.entityId, event.databaseEntity, event.entity, null);
  }

  private enqueue(
    action: AuditAction,
    entity: string,
    entityId: unknown,
    oldValue: unknown,
    newValue: unknown,
    diff: Record<string, { old: unknown; new: unknown }> | null,
  ) {
    this.emitter.emit(AUDIT_EVENT, {
      action,
      entity,
      entityId: entityId == null ? null : String(entityId),
      oldValue: this.sanitise(oldValue),
      newValue: this.sanitise(newValue),
      diff,
      ...getAuditContext(),
      createdAt: new Date(),
    });
  }

  private isAudited(entity: string) {
    return AUDITED_ENTITIES.has(entity);
  }

  private entityId(entity: unknown): unknown {
    return entity && typeof entity === 'object' ? (entity as { id?: unknown }).id : null;
  }

  private sanitise(value: unknown, seen = new WeakSet<object>(), collapseId = false): any {
    if (value == null || typeof value !== 'object') return value;
    if (value instanceof Date) return value;
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    if (Array.isArray(value)) {
      if (value.every((item) => item && typeof item === 'object' && 'id' in item)) {
        return value.map((item) => (item as { id: unknown }).id);
      }
      return value.map((item) => this.sanitise(item, seen));
    }

    if (collapseId && 'id' in value && Object.keys(value).length > 0) {
      return (value as { id: unknown }).id;
    }

    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (!SKIP_FIELDS.has(key)) result[key] = this.sanitise(item, seen, true);
    }
    return result;
  }

  private normalise(value: unknown) {
    return this.sanitise(value);
  }

  private sameValue(left: unknown, right: unknown) {
    if (Object.is(left, right)) return true;
    if (left && right && typeof left === 'object' && typeof right === 'object') {
      return JSON.stringify(left) === JSON.stringify(right);
    }
    return false;
  }
}
