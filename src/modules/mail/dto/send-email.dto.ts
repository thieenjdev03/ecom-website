import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Premium Cotton T-Shirt',
    type: 'string'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 2,
    type: 'number'
  })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: 'Price per item',
    example: 24.99,
    type: 'number'
  })
  @IsNumber()
  price: number;
}

export class SendOrderConfirmationDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
    type: 'string'
  })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
    type: 'string'
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Order ID',
    example: 'ORD-12345',
    type: 'string'
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Total order amount',
    example: 49.98,
    type: 'number'
  })
  @IsNumber()
  orderTotal: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    type: 'string'
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
    example: [
      {
        name: 'Premium Cotton T-Shirt',
        quantity: 2,
        price: 24.99
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class SendPasswordResetDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    type: 'string'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password reset token',
    example: 'abc123def456ghi789',
    type: 'string'
  })
  @IsString()
  resetToken: string;
}

export class SendWelcomeEmailDto {
  @ApiProperty({
    description: 'User email address',
    example: 'newuser@example.com',
    type: 'string'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'Jane Smith',
    type: 'string'
  })
  @IsString()
  name: string;
}

export class SendPaymentFailureDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
    type: 'string'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Order ID',
    example: 'ORD-12345',
    type: 'string'
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Failure reason',
    example: 'Insufficient funds',
    type: 'string'
  })
  @IsString()
  reason: string;
}

export class TestWelcomeEmailDto {
  @ApiProperty({
    description: 'Email address to send test welcome email',
    example: 'test@example.com',
    type: 'string'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User name (optional, defaults to "Test User")',
    example: 'John Doe',
    type: 'string',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export type MailTemplateType =
  | 'payment-success'
  | 'order-confirmation'
  | 'password-reset'
  | 'welcome'
  | 'payment-failure'
  | 'paid-order-confirmation';

export class TestTemplateEmailDto {
  @ApiProperty({
    description: 'Email address to send the test email to',
    example: 'qa@example.com',
    type: 'string',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mail template to test',
    example: 'paid-order-confirmation',
    enum: ['payment-success', 'order-confirmation', 'password-reset', 'welcome', 'payment-failure', 'paid-order-confirmation'],
  })
  @IsString()
  @IsIn(['payment-success', 'order-confirmation', 'password-reset', 'welcome', 'payment-failure', 'paid-order-confirmation'])
  template: MailTemplateType;
}
