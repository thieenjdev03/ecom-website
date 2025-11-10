import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsUUID, ValidateNested, IsNotEmpty, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID (UUID)', example: 'fc734035-40fe-441c-a989-92004dc368fb' })
  @IsUUID(4, { message: 'productId must be a valid UUID v4' })
  productId: string;

  @ApiProperty({ description: 'Product name', example: 'Premium T-Shirt' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ description: 'Product slug', example: 'premium-t-shirt' })
  @IsString()
  @IsNotEmpty()
  productSlug: string;

  @ApiPropertyOptional({ description: 'Variant ID for products with variants', example: 'variant-123' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ description: 'Variant name', example: 'Red - Large' })
  @IsOptional()
  @IsString()
  variantName?: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  @IsNumber()
  @Min(1, { message: 'quantity must be greater than 0' })
  quantity: number;

  @ApiProperty({ description: 'Unit price (formatted as string with two decimals)', example: '29.99' })
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'unitPrice must be a string with two decimal places (e.g., "29.99")' })
  unitPrice: string;

  @ApiProperty({ description: 'Total price for this item (formatted as string with two decimals)', example: '59.98' })
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'totalPrice must be a string with two decimal places (e.g., "59.98")' })
  totalPrice: string;

  @ApiPropertyOptional({ description: 'SKU', example: 'TSH-001-RED-L' })
  @IsOptional()
  @IsString()
  sku?: string;
}

export class OrderSummaryDto {
  @ApiProperty({ description: 'Subtotal amount (formatted as string with two decimals)', example: '59.98' })
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'subtotal must be a string with two decimal places (e.g., "59.98")' })
  subtotal: string;

  @ApiProperty({ description: 'Shipping cost (formatted as string with two decimals)', example: '5.99' })
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'shipping must be a string with two decimal places (e.g., "5.99")' })
  shipping: string;

  @ApiProperty({ description: 'Tax amount (formatted as string with two decimals)', example: '6.60' })
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'tax must be a string with two decimal places (e.g., "6.60")' })
  tax: string;

  @ApiProperty({ description: 'Discount amount (formatted as string with two decimals)', example: '0.00' })
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'discount must be a string with two decimal places (e.g., "0.00")' })
  discount: string;

  @ApiProperty({ description: 'Total amount (formatted as string with two decimals)', example: '72.57' })
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'total must be a string with two decimal places (e.g., "72.57")' })
  total: string;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  currency: string;
}

export class ShippingAddressDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ description: 'Phone number', example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Address line', example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  address_line: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Ward', example: 'Ward 1' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ description: 'District', example: 'District 1' })
  @IsOptional()
  @IsString()
  district?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'User ID', example: 'uuid-string' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Order items', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Order summary', type: OrderSummaryDto })
  @ValidateNested()
  @Type(() => OrderSummaryDto)
  summary: OrderSummaryDto;

  @ApiPropertyOptional({ description: 'Payment method', enum: ['PAYPAL', 'STRIPE', 'COD'], example: 'PAYPAL' })
  @IsOptional()
  @IsEnum(['PAYPAL', 'STRIPE', 'COD'])
  paymentMethod?: 'PAYPAL' | 'STRIPE' | 'COD';

  @ApiPropertyOptional({ description: 'Shipping address ID', example: 'uuid-string' })
  @IsOptional()
  @IsUUID()
  shippingAddressId?: string;

  @ApiPropertyOptional({ description: 'Billing address ID', example: 'uuid-string' })
  @IsOptional()
  @IsUUID()
  billingAddressId?: string;

  @ApiPropertyOptional({ description: 'Shipping address object (alternative to shippingAddressId)', type: ShippingAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shipping_address?: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Order notes', example: 'Please deliver after 5 PM' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'Order status', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED', 'REFUNDED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED', 'REFUNDED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Payment method', enum: ['PAYPAL', 'STRIPE', 'COD'], example: 'PAYPAL' })
  @IsOptional()
  @IsEnum(['PAYPAL', 'STRIPE', 'COD'])
  paymentMethod?: 'PAYPAL' | 'STRIPE' | 'COD';

  @ApiPropertyOptional({ description: 'PayPal order ID', example: '6S5011234B5562345' })
  @IsOptional()
  @IsString()
  paypalOrderId?: string;

  @ApiPropertyOptional({ description: 'PayPal transaction ID', example: '3GG57250SL7328348' })
  @IsOptional()
  @IsString()
  paypalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Paid amount (formatted as string with two decimals)', example: '72.57' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'paidAmount must be a string with two decimal places (e.g., "72.57")' })
  paidAmount?: string;

  @ApiPropertyOptional({ description: 'Paid currency', example: 'USD' })
  @IsOptional()
  @IsString()
  paidCurrency?: string;

  @ApiPropertyOptional({ description: 'Tracking number', example: '1Z999AA1234567890' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Carrier name', example: 'UPS' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Internal notes', example: 'Customer requested expedited shipping' })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}
