import { OrderStatus } from './enums/order-status.enum';
import { OrdersService } from './orders.service';

describe('OrdersService Mingo transitions', () => {
  const service = new OrdersService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  const canGo = (from: OrderStatus, to: OrderStatus): boolean =>
    (service as any).isValidStatusTransition(from, to);

  it('walks the compact Mingo fulfillment flow one step at a time', () => {
    const flow = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.CONFIRMED,
      OrderStatus.PACKED,
      OrderStatus.IN_TRANSIT,
      OrderStatus.DELIVERED,
    ];

    flow.slice(0, -1).forEach((status, index) => {
      expect(canGo(status, flow[index + 1])).toBe(true);
    });

    // Không được nhảy cóc qua bước trung gian.
    expect(canGo(OrderStatus.PENDING_PAYMENT, OrderStatus.DELIVERED)).toBe(false);
    expect(canGo(OrderStatus.PAID, OrderStatus.IN_TRANSIT)).toBe(false);
  });

  it('treats REFUNDED as terminal and allows cancel before shipping', () => {
    expect(canGo(OrderStatus.REFUNDED, OrderStatus.PAID)).toBe(false);
    expect(canGo(OrderStatus.PACKED, OrderStatus.CANCELLED)).toBe(true);
    expect(canGo(OrderStatus.DELIVERED, OrderStatus.CANCELLED)).toBe(false);
  });
});
