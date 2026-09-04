import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Claims a passwordless guest account (created from checkout) by setting its
 * first password. No OTP: identified by the same phone/email the guest order
 * was placed under. See [[account-claim]] for the accepted trade-off.
 */
export class SetPasswordDto {
  @ApiPropertyOptional({ example: '0909090909' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;
}
