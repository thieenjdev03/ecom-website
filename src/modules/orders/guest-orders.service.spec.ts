import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { OrdersService } from './orders.service';
import { OrderStatus } from './enums/order-status.enum';

const token = 'ab'.repeat(32);
const tokenHash = createHash('sha256').update(token).digest('hex');
const payload = {
  items: [{ productId: 'p1', productName: 'Ice cream', productSlug: 'ice', quantity: 1, unitPrice: '50000.00', totalPrice: '50000.00' }],
  summary: { subtotal: '50000.00', shipping: '0.00', tax: '0.00', discount: '0.00', total: '50000.00', currency: 'VND' },
  shipping_address: { full_name: 'Guest', phone: '0909090909', address_line: '123 Street', countryCode: 'VN', province: 'HCM', district: 'Ward' },
};

describe('Independent guest orders', () => {
  let repository: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let users: { findOne: jest.Mock };
  let addresses: { upsertFromCheckout: jest.Mock };
  let points: { earnForOrder: jest.Mock; reverseForOrder: jest.Mock };
  let service: OrdersService;
  beforeEach(() => {
    repository = { findOne: jest.fn(), create: jest.fn(value => value), save: jest.fn(async value => value) };
    users = { findOne: jest.fn() };
    addresses = { upsertFromCheckout: jest.fn() };
    points = { earnForOrder: jest.fn(), reverseForOrder: jest.fn() };
    service = new OrdersService(repository as any, users as any, {} as any, {} as any, addresses as any, points as any);
  });

  it('persists contact and address on the order without touching users or address books', async () => {
    const order = await service.create(payload as any, { email: 'guest@example.com', phone: '84909090909', tokenHash });
    expect(order.userId).toBeNull();
    expect(order.guestEmail).toBe('guest@example.com');
    expect(order.guestTrackingTokenHash).toBe(tokenHash);
    expect(order.shippingSnapshot).toMatchObject({ receiver_name: 'Guest', province_name: 'HCM', address_line: '123 Street' });
    expect(users.findOne).not.toHaveBeenCalled();
    expect(addresses.upsertFromCheckout).not.toHaveBeenCalled();
  });

  it('rejects a guest attempting to use a saved address', async () => {
    await expect(service.create({ ...payload, shippingAddressId: 'someone-elses-address' } as any, { email: 'guest@example.com', phone: '84909090909', tokenHash })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'wrong'])('rejects malformed secrets without a database lookup: %s', async secret => {
    await expect(service.trackGuestOrder('ORD-1', secret as string)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('binds the secret to its exact order number', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.trackGuestOrder('ORD-OTHER', token)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { orderNumber: 'ORD-OTHER', guestTrackingTokenHash: tokenHash } });
  });

  it('returns only customer-visible fields and reflects staff payment confirmation', async () => {
    repository.findOne.mockResolvedValue({ userId: null, orderNumber: 'ORD-1', status: OrderStatus.PAID, internalNotes: 'secret', guestEmail: 'private@example.com', guestTrackingTokenHash: tokenHash, tracking_history: [{ to_status: OrderStatus.PAID, changed_at: 'today', changed_by: 'admin', note: 'private' }] });
    const view = await service.trackGuestOrder('ORD-1', token);
    expect(view.paymentStatus).toBe('PAID');
    expect(view).not.toHaveProperty('internalNotes');
    expect(view).not.toHaveProperty('guestEmail');
    expect(view).not.toHaveProperty('guestTrackingTokenHash');
    expect(view.trackingHistory).toEqual([{ status: OrderStatus.PAID, changedAt: 'today' }]);
  });

  it('never serves an account order from the guest endpoint', async () => {
    repository.findOne.mockResolvedValue({ userId: 'registered-user' });
    await expect(service.trackGuestOrder('ORD-1', token)).rejects.toBeInstanceOf(NotFoundException);
  });
});
