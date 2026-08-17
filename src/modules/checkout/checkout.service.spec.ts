import { CheckoutService } from './checkout.service';

describe('CheckoutService', () => {
  const product = {
    id: 'product-1',
    name: { vi: 'Kem que Mingo', en: 'Mingo Ice Cream' },
    slug: { vi: 'kem-que-mingo', en: 'mingo-ice-cream' },
    price: 30000,
    sale_price: 25000,
    stock_quantity: 10,
    status: 'active',
    images: ['https://cdn.example.com/ice-cream.webp'],
    weight_grams: 90,
  };

  const createService = () => {
    const addressRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        recipientName: 'Nguyễn Văn A',
        recipientPhone: '0901234567',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Bến Nghé',
        streetLine1: '1 Nguyễn Huệ',
        streetLine2: null,
      }),
    };
    const cartService = {
      getCheckoutCart: jest.fn().mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            product_id: product.id,
            product,
            quantity: 2,
          },
        ],
      }),
      getCartRecord: jest.fn().mockResolvedValue({ id: 'cart-1' }),
    };
    const orderRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'MGO-TEST', cartId: 'cart-1' }),
    };
    const service = new CheckoutService(
      {} as any,
      cartService as any,
      {} as any,
      addressRepository as any,
      orderRepository as any,
    );
    return { service, cartService, addressRepository, orderRepository };
  };

  it('uses backend product prices and the fixed 35,000 VND shipping fee', async () => {
    const { service } = createService();
    const result = await service.quote('a'.repeat(32), 'vi');

    expect(result).toMatchObject({
      summary: {
        subtotal: '50000.00',
        shipping: '35000.00',
        total: '85000.00',
        currency: 'VND',
      },
      shipping: {
        shipping_fee: 35000,
        serviceable: true,
      },
    });
  });

  it('only returns an order belonging to the requesting cart token', async () => {
    const { service, orderRepository } = createService();
    await expect(service.getOrder('MGO-TEST', 'a'.repeat(32))).resolves.toMatchObject({ id: 'order-1' });
    expect(orderRepository.findOne).toHaveBeenCalledWith({
      where: { orderNumber: 'MGO-TEST', cartId: 'cart-1' },
    });
  });
});
