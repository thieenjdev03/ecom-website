import { IsString, IsOptional, IsUUID, IsInt, Min, IsNumber, IsObject } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productVariantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class MergeCartDto {
  @IsString()
  sessionId: string;
}

