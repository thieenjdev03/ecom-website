import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { 
  SendOrderConfirmationDto, 
  SendPasswordResetDto, 
  SendWelcomeEmailDto,
  SendPaymentFailureDto,
  TestWelcomeEmailDto
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
  @ApiBody({
    type: SendOrderConfirmationDto,
    description: 'Order confirmation email request body',
    examples: {
      example1: {
        summary: 'Complete order confirmation',
        value: {
          customerEmail: 'customer@example.com',
          customerName: 'John Doe',
          orderId: 'ORD-12345',
          orderTotal: 49.98,
          currency: 'USD',
          items: [
            {
              name: 'Premium Cotton T-Shirt',
              quantity: 2,
              price: 24.99
            }
          ]
        }
      }
    }
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
  @ApiBody({
    type: SendPasswordResetDto,
    description: 'Password reset email request body',
    examples: {
      example1: {
        summary: 'Password reset request',
        value: {
          email: 'user@example.com',
          resetToken: 'abc123def456ghi789'
        }
      }
    }
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
  @ApiBody({
    type: SendWelcomeEmailDto,
    description: 'Welcome email request body',
    examples: {
      example1: {
        summary: 'Welcome email with name',
        value: {
          email: 'newuser@example.com',
          name: 'Jane Smith'
        }
      }
    }
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

  @Post('test-welcome')
  @ApiOperation({ 
    summary: 'Test send welcome email',
    description: 'Test endpoint to send a welcome email. Only requires email address, name is optional.'
  })
  @ApiBody({
    type: TestWelcomeEmailDto,
    description: 'Test welcome email request body',
    examples: {
      example1: {
        summary: 'With name',
        value: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      },
      example2: {
        summary: 'Without name (uses default)',
        value: {
          email: 'test@example.com'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Test welcome email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Test welcome email sent to test@example.com'
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
  async testWelcomeEmail(@Body() data: TestWelcomeEmailDto) {
    if (!data?.email) {
      throw new BadRequestException('email is required');
    }
    try {
      await this.mailService.sendWelcomeEmail(data.email, data?.name || 'Test User');
      return {
        success: true,
        message: `Test welcome email sent to ${data.email}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send test email: ${error.message}`,
      };
    }
  }

  @Post('payment-failure')
  @ApiOperation({ 
    summary: 'Send payment failure notification',
    description: 'Sends a payment failure notification email to the customer with failure details.'
  })
  @ApiBody({
    type: SendPaymentFailureDto,
    description: 'Payment failure notification request body',
    examples: {
      example1: {
        summary: 'Payment failure notification',
        value: {
          email: 'customer@example.com',
          orderId: 'ORD-12345',
          reason: 'Insufficient funds'
        }
      },
      example2: {
        summary: 'Card declined',
        value: {
          email: 'customer@example.com',
          orderId: 'ORD-67890',
          reason: 'Card declined by bank'
        }
      }
    }
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
