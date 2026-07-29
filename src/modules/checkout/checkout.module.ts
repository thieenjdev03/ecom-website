import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '../addresses/address.entity';
import { CartModule } from '../cart/cart.module';
import { ShippingModule } from '../shipping/shipping.module';
import { VnpayModule } from '../vnpay/vnpay.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({ imports: [TypeOrmModule.forFeature([Address]), CartModule, ShippingModule, VnpayModule], controllers: [CheckoutController], providers: [CheckoutService] })
export class CheckoutModule {}
