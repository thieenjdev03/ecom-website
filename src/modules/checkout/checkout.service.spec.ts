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
    };
    const shippingService = {
      quote: jest.fn().mockResolvedValue({
        serviceable: true,
        shipping_fee: 25000,
        shipping_zone: 'INNER_CITY',
        fulfillment_type: 'DIRECT',
        dealer: null,
      }),
    };
    const service = new CheckoutService(
      {} as any,
      cartService as any,
      shippingService as any,
      {} as any,
      addressRepository as any,
    );
    return { service, cartService, shippingService, addressRepository };
  };

  it('uses backend product prices and shipping quote only', async () => {
    const { service } = createService();
    const result = await service.quote(
      'user-1',
      'a'.repeat(32),
      {
        shipping_address_id: '11111111-1111-4111-8111-111111111111',
        province_code: '79',
        district_code: '760',
      },
      'vi',
    );

    expect(result).toMatchObject({
      summary: {
        subtotal: '50000.00',
        shipping: '25000.00',
        total: '75000.00',
        currency: 'VND',
      },
      shipping: {
        shipping_zone: 'INNER_CITY',
      },
    });
  });

  it('blocks checkout when the shipping area is not serviceable', async () => {
    const { service, shippingService } = createService();
    shippingService.quote.mockResolvedValue({
      serviceable: false,
      reason: 'Khu vực chưa hỗ trợ giao hàng',
    });

    await expect(
      service.quote('user-1', 'a'.repeat(32), {
        shipping_address_id: '11111111-1111-4111-8111-111111111111',
        province_code: '01',
        district_code: '001',
      }),
    ).rejects.toThrow('Khu vực chưa hỗ trợ giao hàng');
  });
});
