import { GuestOrdersController } from './guest-orders.controller';
import { MeOrdersController } from './me-orders.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { User } from '../users/user.entity';
import { Address } from '../addresses/address.entity';
import { Product } from '../products/entities/product.entity';
import { MailModule } from '../mail/mail.module';
import { AddressesModule } from '../addresses/addresses.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Address, Product]),
    MailModule,
    AddressesModule,
    PointsModule,
  ],
  controllers: [OrdersController, GuestOrdersController, MeOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
