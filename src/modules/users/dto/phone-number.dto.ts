import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PhoneLabel } from '../entities/user-phone-number.entity';

export class CreatePhoneNumberDto {
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsEnum(PhoneLabel)
  label?: PhoneLabel;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdatePhoneNumberDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(PhoneLabel)
  label?: PhoneLabel;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

