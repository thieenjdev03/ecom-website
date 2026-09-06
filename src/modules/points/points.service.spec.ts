import { calculateMingoPoints, MINGO_POINT_VALUE_VND } from './points.service';

describe('calculateMingoPoints', () => {
  it('uses 10,000 VND as the value of one point', () => {
    expect(MINGO_POINT_VALUE_VND).toBe(10_000);
    expect(calculateMingoPoints(10_000)).toBe(1);
    expect(calculateMingoPoints(100_000)).toBe(10);
  });

  it('rounds fractional points to the nearest whole point', () => {
    expect(calculateMingoPoints(14_999)).toBe(1);
    expect(calculateMingoPoints(15_000)).toBe(2);
    expect(calculateMingoPoints(15_001)).toBe(2);
  });

  it('supports database decimal values returned as strings', () => {
    expect(calculateMingoPoints('100000.00')).toBe(10);
  });

  it.each([0, -10_000, undefined, null, 'invalid'])(
    'returns zero for an invalid total: %p',
    (total) => {
      expect(calculateMingoPoints(total)).toBe(0);
    },
  );
});

import { PointsService } from './points.service';
import { Order } from '../orders/entities/order.entity';

it('never writes loyalty transactions for a guest order', async () => {
  const database = { transaction: jest.fn() };
  const service = new PointsService(database as any);
  const order = { id: 'guest-order', userId: null, summary: { total: '100000' } } as Order;
  await service.earnForOrder(order);
  await service.reverseForOrder(order);
  expect(database.transaction).not.toHaveBeenCalled();
});
