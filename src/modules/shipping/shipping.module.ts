import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShippingConfigService } from './shipping-config.service';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ShippingController],
  providers: [ShippingConfigService],
  exports: [ShippingConfigService],
})
export class ShippingModule {}


