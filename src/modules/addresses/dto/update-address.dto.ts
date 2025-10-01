import { IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsPhoneNumber, IsString, Length, MaxLength } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  recipientPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  streetLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  streetLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  latitude?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isShipping?: boolean;

  @IsOptional()
  @IsBoolean()
  isBilling?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}


