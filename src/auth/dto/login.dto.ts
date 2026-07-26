import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail({}, { message: 'Invalid email format. Please enter a valid email address.' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;
}


