import { IsString, IsNotEmpty, IsNumber, IsArray, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsNotEmpty()
  items: any[];

  @IsOptional()
  shippingAddress?: any;

  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status?: string = 'PENDING';
}
