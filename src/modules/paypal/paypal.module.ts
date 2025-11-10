import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';
import { PaymentService } from './payment.service';
import { PaypalEvent } from './entities/paypal-event.entity';
import { OrdersModule } from '../orders/orders.module';
import { MailModule } from '../mail/mail.module';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaypalEvent, Order]),
    OrdersModule,
    MailModule,
  ],
  controllers: [PaypalController],
  providers: [PaypalService, PaymentService],
  exports: [PaypalService, PaymentService],
})
export class PaypalModule {}

