import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: '123456' })
  @IsString()
  otp!: string
}
