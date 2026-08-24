export const AUDIT_EVENT = 'audit.log';

export const AUDITED_ENTITIES = new Set([
  'Product',
  'Order',
  'Category',
  'User',
  'Collection',
]);

export const SKIP_FIELDS = new Set([
  'password',
  'passwordHash',
  'refreshToken',
  'refreshTokenHash',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
  'deletedAt',
  'deleted_at',
]);

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';
