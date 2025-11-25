import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import { ShippingConfigService } from './shipping-config.service';
import { GetShippingPriceDto } from './dto/get-shipping-price.dto';

@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shippingConfigService: ShippingConfigService,
  ) {}

  @Get('price')
  async getPrice(@Query() query: GetShippingPriceDto) {
    const method =
      query.method ?? this.shippingConfigService.getDefaultMethod();

    const result = await this.shippingConfigService.getPrice({
      country: query.country,
      province: query.province,
      district: query.district,
      weight: query.weight,
      method,
    });

    if (!result) {
      throw new NotFoundException('No shipping rule matched');
    }

    return {
      currency: this.shippingConfigService.getCurrency(),
      price: result.price,
      matchedRule: {
        country: result.rule.country,
        province: result.rule.province,
        district: result.rule.district,
        shipping_method: result.rule.shippingMethod,
        min_weight: result.rule.minWeight,
        max_weight: result.rule.maxWeight,
      },
    };
  }

  @Get('config')
  async getConfig() {
    const [rules, cache] = await Promise.all([
      this.shippingConfigService.getAllRules(),
      this.shippingConfigService.getCacheMeta(),
    ]);

    return {
      cache,
      currency: this.shippingConfigService.getCurrency(),
      defaultMethod: this.shippingConfigService.getDefaultMethod(),
      supportedMethods: this.shippingConfigService.getSupportedMethods(),
      totalRules: rules.length,
      rules,
    };
  }

  @Get('countries')
  async getCountryConfigs() {
    const countries = await this.shippingConfigService.getCountryConfigs();

    return {
      total: countries.length,
      countries,
    };
  }

  @Post('config/reload')
  @HttpCode(204)
  async reloadConfig() {
    await this.shippingConfigService.loadFromSheet();
  }
}


