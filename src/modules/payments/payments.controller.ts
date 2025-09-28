import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paypal/create')
  createPayPalOrder(@Body() orderData: any) {
    return this.paymentsService.createPayPalOrder(orderData);
  }

  @Post('paypal/capture/:orderId')
  capturePayPalOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.capturePayPalOrder(orderId);
  }

  @Post('paypal/webhook')
  handleWebhook(@Body() webhookData: any) {
    return this.paymentsService.handleWebhook(webhookData);
  }
}
