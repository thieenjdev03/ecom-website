import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('order-confirmation')
  sendOrderConfirmation(@Body() orderData: any) {
    if (!orderData) {
      throw new BadRequestException('Missing request body');
    }
    return this.mailService.sendOrderConfirmation(orderData);
  }

  @Post('password-reset')
  sendPasswordReset(@Body() data: { email: string; resetToken: string }) {
    if (!data?.email || !data?.resetToken) {
      throw new BadRequestException('email and resetToken are required');
    }
    return this.mailService.sendPasswordReset(data.email, data.resetToken);
  }

  @Post('welcome')
  sendWelcomeEmail(@Body() data: { email: string; name: string }) {
    if (!data?.email) {
      throw new BadRequestException('email is required');
    }
    return this.mailService.sendWelcomeEmail(data.email, data?.name || '');
  }
}
