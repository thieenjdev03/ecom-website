import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AddToWishlistDto {

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateWishlistDto {
  @IsOptional()
  @IsString()
  note?: string;
}

