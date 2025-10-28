import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { 
  SendOrderConfirmationDto, 
  SendPasswordResetDto, 
  SendWelcomeEmailDto,
  SendPaymentFailureDto 
} from './dto/send-email.dto';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('order-confirmation')
  @ApiOperation({ 
    summary: 'Send order confirmation email',
    description: 'Sends a professional order confirmation email to the customer with order details.'
  })
  @ApiResponse({
    status: 200,
    description: 'Order confirmation email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Order confirmation email sent to customer@example.com for order ORD-12345'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
    schema: {
      example: {
        success: false,
        message: 'Missing required fields: customerEmail, customerName, orderId'
      }
    }
  })
  sendOrderConfirmation(@Body() orderData: SendOrderConfirmationDto) {
    if (!orderData) {
      throw new BadRequestException('Missing request body');
    }
    return this.mailService.sendOrderConfirmation(orderData);
  }

  @Post('password-reset')
  @ApiOperation({ 
    summary: 'Send password reset email',
    description: 'Sends a password reset email with secure reset link to the user.'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Password reset email sent to user@example.com'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
    schema: {
      example: {
        success: false,
        message: 'email and resetToken are required'
      }
    }
  })
  sendPasswordReset(@Body() data: SendPasswordResetDto) {
    if (!data?.email || !data?.resetToken) {
      throw new BadRequestException('email and resetToken are required');
    }
    return this.mailService.sendPasswordReset(data.email, data.resetToken);
  }

  @Post('welcome')
  @ApiOperation({ 
    summary: 'Send welcome email',
    description: 'Sends a welcome email to new users with store information and features.'
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Welcome email sent to newuser@example.com'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
    schema: {
      example: {
        success: false,
        message: 'email is required'
      }
    }
  })
  sendWelcomeEmail(@Body() data: SendWelcomeEmailDto) {
    if (!data?.email) {
      throw new BadRequestException('email is required');
    }
    return this.mailService.sendWelcomeEmail(data.email, data?.name || '');
  }

  @Post('payment-failure')
  @ApiOperation({ 
    summary: 'Send payment failure notification',
    description: 'Sends a payment failure notification email to the customer with failure details.'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment failure notification sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Payment failure notification sent to customer@example.com for order ORD-12345'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
    schema: {
      example: {
        success: false,
        message: 'Missing required fields: email, orderId, reason'
      }
    }
  })
  sendPaymentFailureNotification(@Body() data: SendPaymentFailureDto) {
    if (!data?.email || !data?.orderId || !data?.reason) {
      throw new BadRequestException('email, orderId, and reason are required');
    }
    return this.mailService.sendPaymentFailureNotification(data.email, data.orderId, data.reason);
  }
}
