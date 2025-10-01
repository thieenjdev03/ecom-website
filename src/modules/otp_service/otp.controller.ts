import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SendOtpDto } from './dtos/send-otp.dto'
import { VerifyOtpDto } from './dtos/verify-otp.dto'
import { OtpService } from './otp.service'

@ApiTags('OTP')
@Controller('api/v1/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send OTP to email' })
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.email)
  }

  @Post('send-password-reset')
  @ApiOperation({ summary: 'Send OTP for password reset' })
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendPasswordResetOtp(dto.email)
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto.email, dto.otp)
  }
}
