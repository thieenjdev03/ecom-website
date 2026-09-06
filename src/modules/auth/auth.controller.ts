import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from '../../auth/dto/register.dto';
import { LoginDto } from '../../auth/dto/login.dto';
import { LoginResponseDto, LoginUserDto } from '../../auth/dto/login-response.dto';
import { CheckExistsDto } from '../../auth/dto/check-exists.dto';
import { SetPasswordDto } from '../../auth/dto/set-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiCreatedResponse({ description: 'User registered successfully', type: LoginUserDto })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
      dto.phoneNumber,
      dto.country,
      dto.marketingOptIn ?? true,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email or phone to get access token' })
  @ApiOkResponse({ description: 'Login successful', type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('check-exists')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Look up an account by phone or email before registering. Used by the storefront to route "Đăng ký" to either normal registration or claiming an existing guest account (exists && !hasPassword).',
  })
  @ApiOkResponse({ description: 'exists / hasPassword flags' })
  async checkExists(@Body() dto: CheckExistsDto) {
    return this.authService.checkExists(dto);
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Legacy account claiming is disabled. Use registration or password reset.',
  })
  @ApiOkResponse({ description: 'Password set; login successful', type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input, account not found, or already has a password' })
  async setPassword(@Body() dto: SetPasswordDto) {
    return this.authService.setPassword(dto);
  }
}


