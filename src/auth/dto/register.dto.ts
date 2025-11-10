import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, IsNotEmpty } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail({}, { message: 'Invalid email format. Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;  

  @ApiProperty({ example: 'password123' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString({ message: 'First name must be a string.' })
  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString({ message: 'Last name must be a string.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName: string;

  @ApiProperty({ example: '0909090909' })
  @IsString({ message: 'Phone number must be a string.' })
  @IsNotEmpty({ message: 'Phone number is required.' })
  phoneNumber: string;

  @ApiProperty({ example: 'Vietnam' })
  @IsString({ message: 'Country must be a string.' })
  @IsNotEmpty({ message: 'Country is required.' })
  country: string;
}
