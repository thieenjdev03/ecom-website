import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsUUID, ValidateNested, IsNotEmpty, Matches, Min, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../enums/order-status.enum';
import { TrackingHistoryItem } from '../entities/order.entity';

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

  @ApiProperty({ description: 'Phone number', example: '+84 912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Two-letter country code', example: 'VN' })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiProperty({ description: 'Province/State', example: 'Ho Chi Minh' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ description: 'District/County', example: 'District 1' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional({ description: 'Ward', example: 'Ward 1' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ description: 'Primary street line', example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  address_line: string;

  @ApiPropertyOptional({ description: 'Second street line', example: 'Apt 12B' })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional({ description: 'City name (if different from province)', example: 'Ho Chi Minh City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '700000' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Custom label for the address', example: 'Checkout - July' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Address note', example: 'Call before arrival' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Mark as billing address', example: false })
  @IsOptional()
  isBilling?: boolean;

  @ApiPropertyOptional({ description: 'Mark as default shipping address', example: true })
  @IsOptional()
  isDefault?: boolean;
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
  @ApiPropertyOptional({
    description: 'Order status',
    enum: Object.values(OrderStatus),
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

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

export class ChangeOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: Object.values(OrderStatus),
    example: OrderStatus.PACKED
  })
  @IsEnum(OrderStatus)
  toStatus: OrderStatus;

  @ApiPropertyOptional({
    description: 'Optional note for status change',
    example: 'Order packed at warehouse'
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class StatusHistoryItemDto {
  @ApiProperty({ description: 'Previous status', enum: Object.values(OrderStatus) })
  from_status: OrderStatus;

  @ApiProperty({ description: 'New status', enum: Object.values(OrderStatus) })
  to_status: OrderStatus;

  @ApiProperty({ description: 'Timestamp when status changed', example: '2025-01-01T01:00:00.000Z' })
  changed_at: Date;

  @ApiProperty({ description: 'User ID who changed the status', example: 'user-uuid' })
  changed_by: string;

  @ApiPropertyOptional({ description: 'Optional note for the change', example: 'Order packed at warehouse' })
  note?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds since previous status change', example: 3600 })
  duration_seconds?: number;
}
