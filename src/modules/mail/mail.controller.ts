import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('order-confirmation')
  sendOrderConfirmation(@Body() orderData: any) {
    return this.mailService.sendOrderConfirmation(orderData);
  }

  @Post('password-reset')
  sendPasswordReset(@Body() data: { email: string; resetToken: string }) {
    return this.mailService.sendPasswordReset(data.email, data.resetToken);
  }

  @Post('welcome')
  sendWelcomeEmail(@Body() data: { email: string; name: string }) {
    return this.mailService.sendWelcomeEmail(data.email, data.name);
  }
}
