import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: '123456' })
  @IsString()
  otp!: string

  @ApiProperty({ example: 'password123' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  newPassword!: string
}
