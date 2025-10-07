import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { OtpModule } from '../modules/otp_service/otp.module';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([User]), OtpModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
