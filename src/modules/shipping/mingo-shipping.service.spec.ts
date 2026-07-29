import { MingoShippingService } from './mingo-shipping.service';

describe('MingoShippingService', () => {
  const makeService = (dealer: any = null) => {
    const values: Record<string, unknown> = {
      'shipping.mingoHomeProvinceCode': '79',
      'shipping.mingoInnerDistrictCodes': '760,761',
      'shipping.mingoInnerCityFee': 25000,
      'shipping.mingoOuterCityFee': 35000,
    };
    const config = { get: jest.fn((key: string) => values[key]) };
    const distributors = { findOne: jest.fn().mockResolvedValue(dealer) };
    return {
      service: new MingoShippingService(config as any, distributors as any),
      distributors,
    };
  };

  it('quotes inner-city delivery directly by Mingo', async () => {
    const { service, distributors } = makeService();
    const quote = await service.quote({
      province_code: '79',
      district_code: '760',
    });

    expect(quote).toMatchObject({
      serviceable: true,
      shipping_zone: 'INNER_CITY',
      shipping_fee: 25000,
      fulfillment_type: 'DIRECT',
    });
    expect(distributors.findOne).not.toHaveBeenCalled();
  });

  it('assigns an active distributor for outer-city delivery', async () => {
    const { service } = makeService({
      id: 'dealer-1',
      name: 'Đại lý Đồng Nai',
      slug: 'dai-ly-dong-nai',
      province_code: '75',
    });
    const quote = await service.quote({
      province_code: '75',
      district_code: '731',
    });

    expect(quote).toMatchObject({
      serviceable: true,
      shipping_zone: 'OUTER_CITY',
      shipping_fee: 35000,
      fulfillment_type: 'DEALER',
      dealer: { id: 'dealer-1' },
    });
  });

  it('rejects an outer-city area without an active distributor', async () => {
    const { service } = makeService();
    const quote = await service.quote({
      province_code: '01',
      district_code: '001',
    });

    expect(quote).toMatchObject({
      serviceable: false,
      shipping_zone: 'OUTER_CITY',
      fulfillment_type: 'DEALER',
      reason: expect.stringContaining('chưa hỗ trợ'),
    });
  });
});
