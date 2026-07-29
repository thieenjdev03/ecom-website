import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShippingConfigService } from './shipping-config.service';
import { ShippingController } from './shipping.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Distributor } from '../distributors/entities/distributor.entity';
import { MingoShippingService } from './mingo-shipping.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Distributor])],
  controllers: [ShippingController],
  providers: [ShippingConfigService, MingoShippingService],
  exports: [ShippingConfigService, MingoShippingService],
})
export class ShippingModule {}

