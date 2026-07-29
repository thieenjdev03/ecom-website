import { OrderStatus, PaymentStatus } from '../orders/enums/order-status.enum';
import { VnpayService } from './vnpay.service';

describe('VnpayService', () => {
  const configValues: Record<string, string> = {
    'vnpay.tmnCode': 'TESTCODE',
    'vnpay.hashSecret': 'test-secret',
    'vnpay.paymentUrl': 'https://sandbox.vnpayment.vn/pay',
    'vnpay.returnUrl': 'http://localhost:3001/checkout/vnpay-return',
    'vnpay.ipnUrl': 'http://localhost:3000/payments/vnpay/ipn',
  };

  const createService = (order?: any) => {
    const manager = {
      findOne: jest.fn().mockResolvedValue(order),
      save: jest.fn().mockImplementation(async (value) => value),
      delete: jest.fn(),
      increment: jest.fn(),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };
    const orders = { findOne: jest.fn().mockResolvedValue(order) };
    const config = {
      get: jest.fn((key: string) => configValues[key]),
    };
    return {
      service: new VnpayService(
        config as any,
        dataSource as any,
        orders as any,
      ),
      manager,
      dataSource,
    };
  };

  it('rejects an invalid VNPay signature', async () => {
    const { service, dataSource } = createService();
    const result = await service.handleIpn({
      vnp_TxnRef: 'MGO-1',
      vnp_Amount: '100000',
      vnp_SecureHash: 'invalid',
    });

    expect(result).toEqual({ RspCode: '97', Message: 'Invalid signature' });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('handles a successful callback idempotently', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'MGO-20260728-AAAA',
      vnpayTxnRef: 'MGO-20260728-AAAA-1234',
      summary: { total: '60000.00' },
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.PAID,
    };
    const { service, dataSource } = createService(order);
    const query: Record<string, unknown> = {
      vnp_TxnRef: order.vnpayTxnRef,
      vnp_Amount: '6000000',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
    };
    query.vnp_SecureHash = (service as any).hash(query, false);

    const result = await service.handleIpn(query);

    expect(result).toEqual({
      RspCode: '02',
      Message: 'Order already confirmed',
    });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('marks a pending order paid once after a valid callback', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'MGO-20260728-BBBB',
      vnpayTxnRef: 'MGO-20260728-BBBB-1234',
      summary: { total: '60000.00' },
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PAID,
      stockReserved: true,
      cartId: null,
    };
    const { service, manager } = createService(order);
    const query: Record<string, unknown> = {
      vnp_TxnRef: order.vnpayTxnRef,
      vnp_Amount: '6000000',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TransactionNo: '123456',
    };
    query.vnp_SecureHash = (service as any).hash(query, false);

    expect(await service.handleIpn(query)).toEqual({
      RspCode: '00',
      Message: 'Confirm Success',
    });
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.PAID,
        stockReserved: false,
      }),
    );
  });

  it('releases reserved stock after a verified failed callback', async () => {
    const order = {
      id: 'order-2',
      orderNumber: 'MGO-20260728-CCCC',
      vnpayTxnRef: 'MGO-20260728-CCCC-1234',
      summary: { total: '60000.00' },
      items: [{ productId: 'product-1', quantity: 2 }],
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PAID,
      stockReserved: true,
    };
    const { service, manager } = createService(order);
    const query: Record<string, unknown> = {
      vnp_TxnRef: order.vnpayTxnRef,
      vnp_Amount: '6000000',
      vnp_ResponseCode: '24',
      vnp_TransactionStatus: '02',
    };
    query.vnp_SecureHash = (service as any).hash(query, false);

    expect(await service.handleIpn(query)).toEqual({
      RspCode: '00',
      Message: 'Confirm Success',
    });
    expect(manager.increment).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'product-1' },
      'stock_quantity',
      2,
    );
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: PaymentStatus.FAILED,
        status: OrderStatus.CANCELLED,
        stockReserved: false,
      }),
    );
  });
});
