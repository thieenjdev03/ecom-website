import { Body, Controller, Headers, Post, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../auth/jwt.guard';
import { CheckoutService } from './checkout.service';
import { CheckoutQuoteDto, CreateCheckoutOrderDto } from './dto/checkout.dto';

@ApiTags('checkout')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Cart-Token', required: true })
@UseGuards(JwtGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}
  @Post('quote')
  quote(@Request() request: any, @Headers('x-cart-token') token: string, @Body() dto: CheckoutQuoteDto, @Query('locale') locale = 'vi') {
    const userId = request.user?.sub || request.user?.userId;
    if (!userId) throw new UnauthorizedException('Unauthorized');
    return this.checkoutService.quote(userId, token, dto, locale);
  }
  @Post('create-order')
  createOrder(@Request() request: any, @Headers('x-cart-token') token: string, @Body() dto: CreateCheckoutOrderDto, @Query('locale') locale = 'vi') {
    const userId = request.user?.sub || request.user?.userId;
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const ip = String(request.headers['x-forwarded-for'] || request.ip || '').split(',')[0].trim();
    return this.checkoutService.createOrder(userId, token, dto, ip, locale);
  }
}
