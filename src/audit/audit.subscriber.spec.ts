import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditSubscriber } from './audit.subscriber';

describe('AuditSubscriber', () => {
  it('emits a safe scalar diff and relation ID snapshot', () => {
    const dataSource = { subscribers: [] } as unknown as DataSource;
    const emitter = { emit: jest.fn() } as unknown as EventEmitter2;
    const subscriber = new AuditSubscriber(dataSource, emitter);

    subscriber.afterUpdate({
      metadata: { name: 'Product' },
      updatedColumns: [{ propertyName: 'name' }, { propertyName: 'passwordHash' }],
      databaseEntity: {
        id: 'product-1',
        name: { en: 'Old' },
        passwordHash: 'old-secret',
        productCollections: [{ id: 'collection-1' }],
      },
      entity: {
        id: 'product-1',
        name: { en: 'New' },
        passwordHash: 'new-secret',
        productCollections: [{ id: 'collection-1' }],
      },
    } as any);

    expect(emitter.emit).toHaveBeenCalledTimes(1);
    const [, payload] = (emitter.emit as jest.Mock).mock.calls[0];
    expect(payload.entityId).toBe('product-1');
    expect(payload.oldValue).toEqual({ id: 'product-1', name: { en: 'Old' }, productCollections: ['collection-1'] });
    expect(payload.newValue).toEqual({ id: 'product-1', name: { en: 'New' }, productCollections: ['collection-1'] });
    expect(payload.diff).toEqual({ name: { old: { en: 'Old' }, new: { en: 'New' } } });
  });
});
