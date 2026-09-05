import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

/**
 * Accepts either identifier. Phone is the primary one for customers who first
 * arrived through guest checkout (see CheckoutService.findOrCreateGuestByPhone),
 * where an email is optional and may never have been collected.
 * `email` stays optional rather than being replaced so existing clients that
 * post { email, password } (admin login) keep working unchanged.
 */
export class LoginDto {
  @ApiPropertyOptional({ example: 'user@gmail.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format. Please enter a valid email address.' })
  email?: string;

  @ApiPropertyOptional({ example: '0909090909' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;
}
