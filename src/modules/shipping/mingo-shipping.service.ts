import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distributor } from '../distributors/entities/distributor.entity';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';

export type MingoShippingZone = 'INNER_CITY' | 'OUTER_CITY';
export type MingoFulfillmentType = 'DIRECT' | 'DEALER';

@Injectable()
export class MingoShippingService {
  private readonly homeProvinceCode: string;
  private readonly innerDistrictCodes: Set<string>;
  private readonly innerCityFee: number;
  private readonly outerCityFee: number;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Distributor) private readonly distributors: Repository<Distributor>,
  ) {
    this.homeProvinceCode = String(this.config.get('shipping.mingoHomeProvinceCode') ?? '').trim();
    this.innerDistrictCodes = new Set(
      String(this.config.get('shipping.mingoInnerDistrictCodes') ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
    this.innerCityFee = Number(this.config.get('shipping.mingoInnerCityFee') ?? 25000);
    this.outerCityFee = Number(this.config.get('shipping.mingoOuterCityFee') ?? 35000);
  }

  async quote(dto: ShippingQuoteDto) {
    const provinceCode = dto.province_code.trim();
    const districtCode = dto.district_code.trim();
    const isInnerCity = provinceCode === this.homeProvinceCode && this.innerDistrictCodes.has(districtCode);

    if (isInnerCity) {
      return {
        serviceable: true,
        shipping_zone: 'INNER_CITY' as MingoShippingZone,
        shipping_fee: this.innerCityFee,
        currency: 'VND',
        fulfillment_type: 'DIRECT' as MingoFulfillmentType,
        dealer: null,
      };
    }

    const dealer = await this.distributors.findOne({
      where: { province_code: provinceCode, is_active: true },
      order: { created_at: 'ASC' },
    });

    if (!dealer) {
      return {
        serviceable: false,
        shipping_zone: 'OUTER_CITY' as MingoShippingZone,
        shipping_fee: this.outerCityFee,
        currency: 'VND',
        fulfillment_type: 'DEALER' as MingoFulfillmentType,
        dealer: null,
        reason: 'Khu vực hiện chưa hỗ trợ giao hàng.',
      };
    }

    return {
      serviceable: true,
      shipping_zone: 'OUTER_CITY' as MingoShippingZone,
      shipping_fee: this.outerCityFee,
      currency: 'VND',
      fulfillment_type: 'DEALER' as MingoFulfillmentType,
      dealer: { id: dealer.id, name: dealer.name, slug: dealer.slug, province_code: dealer.province_code },
    };
  }
}
