import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CartModule } from "../cart/cart.module";
import { OrdersModule } from "../orders/orders.module";
import { User } from "../users/user.entity";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";

@Module({
  imports: [CartModule, OrdersModule, TypeOrmModule.forFeature([User])],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
