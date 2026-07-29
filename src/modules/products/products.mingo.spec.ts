import { ProductsService } from './products.service';

describe('ProductsService Mingo validation', () => {
  const service = new ProductsService({} as any, {} as any, {} as any);

  it('rejects an invalid sale price and conflicting variant stock', () => {
    expect(() =>
      (service as any).validateProduct({ price: 25000, sale_price: 30000 }),
    ).toThrow();
    expect(() =>
      (service as any).validateProduct({
        stock_quantity: 2,
        variants: [{ size_id: 'size-1', sku: 'SKU-1', price: 25000, stock: 2 }],
      }),
    ).toThrow();
  });
});
