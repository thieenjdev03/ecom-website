import { Controller, Get, Header, Param, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../auth/jwt.guard';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth('bearer')
@UseGuards(JwtGuard)
@Controller('me/orders')
export class MeOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get(':orderNumber')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Read an order belonging to the current user' })
  track(@Param('orderNumber') orderNumber: string, @Req() req) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.orders.trackUserOrder(orderNumber, userId);
  }
}
