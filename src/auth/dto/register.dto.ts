import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;  

  @ApiProperty({ example: 'password123' })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '0909090909' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'Vietnam' })
  @IsString()
  country: string;
}
