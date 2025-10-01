import { Module } from '@nestjs/common'
import { OtpController } from './otp.controller'
import { OtpService } from './otp.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EmailOtp } from './entities/email-otp.entity'
import { User } from '../users/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([EmailOtp, User])],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
