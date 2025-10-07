import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from './public.decorator';    
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OtpService } from '../modules/otp_service/otp.service';
import { IsEmail, IsString, Length } from 'class-validator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

class SendLoginOtpDto { @IsEmail() email: string }
class VerifyLoginOtpDto { @IsEmail() email: string; @IsString() @Length(6,6) otp: string }
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly otp: OtpService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
  }

  @Public()
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP for email login' })
  @HttpCode(HttpStatus.OK)
  async sendLoginOtp(@Body() dto: SendLoginOtpDto) {
    return this.otp.sendLoginOtp(dto.email)
  }

  @Public()
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and login' })
  @HttpCode(HttpStatus.OK)
  async verifyLoginOtp(@Body() dto: VerifyLoginOtpDto) {
    const res = await this.otp.verifyOtp(dto.email, dto.otp)
    if (res?.status === 200) {
      return this.auth.loginWithOtp(dto.email)
    }
    return res
  }
}
