import { Controller, Get, Param, Headers, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('guest-orders')
export class GuestOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get(':orderNumber')
  @Header('Cache-Control', 'private, no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @ApiOperation({ summary: 'Read a guest order using the secret link from its confirmation email' })
  @ApiHeader({ name: 'X-Order-Token', required: true })
  track(@Param('orderNumber') orderNumber: string, @Headers('x-order-token') token: string) {
    return this.orders.trackGuestOrder(orderNumber, token);
  }
}
