import {
  Controller,
  Get,
  Param,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../auth/jwt.guard';
import { OrdersService } from './orders.service';

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('me/orders')
export class MeOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get orders owned by the authenticated customer' })
  getOrders(@Request() request: any) {
    return this.ordersService.getUserOrders(this.userId(request));
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get one owned order by its public order number' })
  getOrder(@Param('orderNumber') orderNumber: string, @Request() request: any) {
    return this.ordersService.findByOrderNumberForUser(
      orderNumber,
      this.userId(request),
    );
  }

  private userId(request: any): string {
    const userId = request.user?.sub || request.user?.userId;
    if (!userId) throw new UnauthorizedException('Unauthorized');
    return userId;
  }
}
