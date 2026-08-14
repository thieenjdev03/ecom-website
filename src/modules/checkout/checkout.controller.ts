import { Body, Controller, Get, Headers, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { OptionalJwtGuard } from '../../auth/optional-jwt.guard';
import { CheckoutService } from './checkout.service';
import { CheckoutQuoteDto, CreateCheckoutOrderDto } from './dto/checkout.dto';

@ApiTags('checkout')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Cart-Token', required: true })
@UseGuards(OptionalJwtGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('orders/:orderNumber')
  getOrder(@Headers('x-cart-token') token: string, @Param('orderNumber') orderNumber: string) {
    return this.checkoutService.getOrder(orderNumber, token);
  }

  @Post('quote')
  quote(@Request() request: any, @Headers('x-cart-token') token: string, @Body() dto: CheckoutQuoteDto, @Query('locale') locale = 'vi') {
    const userId = request.user?.sub || request.user?.userId;
    return this.checkoutService.quote(userId ?? null, token, dto, locale);
  }
  @Post('create-order')
  createOrder(@Request() request: any, @Headers('x-cart-token') token: string, @Body() dto: CreateCheckoutOrderDto, @Query('locale') locale = 'vi') {
    const userId = request.user?.sub || request.user?.userId;
    const ip = String(request.headers['x-forwarded-for'] || request.ip || '').split(',')[0].trim();
    return this.checkoutService.createOrder(userId ?? null, token, dto, ip, locale);
  }
}
