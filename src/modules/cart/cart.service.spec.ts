import { BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';

describe('CartService', () => {
  const createService = () => {
    const carts = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: value.id ?? 'cart-1', ...value })),
      delete: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    const items = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      delete: jest.fn(),
      find: jest.fn(),
    };
    const products = { findOne: jest.fn() };
    return {
      service: new CartService(carts as any, items as any, products as any),
      carts,
      items,
      products,
    };
  };

  it('rejects missing or guessable cart tokens', () => {
    const { service } = createService();
    expect(() => service.hashToken('short')).toThrow(BadRequestException);
    expect(() => service.hashToken('a'.repeat(32))).not.toThrow();
  });

  it('uses the backend product price and enforces stock when adding', async () => {
    const { service, carts, items, products } = createService();
    carts.findOne.mockResolvedValue({
      id: 'cart-1',
      token_hash: service.hashToken('a'.repeat(32)),
    });
    products.findOne.mockResolvedValue({
      id: 'product-1',
      status: 'active',
      stock_quantity: 1,
      name: { vi: 'Kem Mingo' },
      price: 25000,
      sale_price: null,
    });
    items.findOne.mockResolvedValue(null);

    await expect(
      service.addItem('a'.repeat(32), {
        productId: 'product-1',
        quantity: 2,
      }),
    ).rejects.toThrow('chỉ còn 1 sản phẩm');
    expect(items.save).not.toHaveBeenCalled();
  });

  it('updates an owned cart item and returns totals from current product data', async () => {
    const { service, carts, items } = createService();
    const product = {
      id: 'product-1',
      status: 'active',
      stock_quantity: 5,
      name: { vi: 'Kem Mingo' },
      slug: { vi: 'kem-mingo' },
      price: 30000,
      sale_price: 25000,
      images: [],
    };
    carts.findOne.mockResolvedValue({ id: 'cart-1' });
    items.findOne.mockResolvedValue({
      id: 'item-1',
      cart_id: 'cart-1',
      product_id: product.id,
      product,
      quantity: 1,
    });
    carts.findOneOrFail.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          product_id: product.id,
          product,
          quantity: 2,
        },
      ],
    });

    const result = await service.updateItem(
      'a'.repeat(32),
      'item-1',
      { quantity: 2 },
      'vi',
    );

    expect(result).toMatchObject({
      subtotal: 50000,
      totalQuantity: 2,
      valid: true,
    });
  });

  it('removes only an item belonging to the token cart', async () => {
    const { service, carts, items } = createService();
    carts.findOne.mockResolvedValue({ id: 'cart-1' });
    items.delete.mockResolvedValue({ affected: 1 });
    carts.findOneOrFail.mockResolvedValue({ id: 'cart-1', items: [] });

    const result = await service.removeItem(
      'a'.repeat(32),
      'item-1',
      'vi',
    );

    expect(items.delete).toHaveBeenCalledWith({
      id: 'item-1',
      cart_id: 'cart-1',
    });
    expect(result).toMatchObject({ subtotal: 0, totalQuantity: 0 });
  });
});
