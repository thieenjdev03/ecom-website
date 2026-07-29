import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { VnpayController } from './vnpay.controller';
import { VnpayService } from './vnpay.service';
import { CartItem } from '../cart/entities/cart-item.entity';

@Module({ imports: [TypeOrmModule.forFeature([Order, CartItem])], controllers: [VnpayController], providers: [VnpayService], exports: [VnpayService] })
export class VnpayModule {}
