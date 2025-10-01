import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AddToWishlistDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateWishlistDto {
  @IsOptional()
  @IsString()
  note?: string;
}

