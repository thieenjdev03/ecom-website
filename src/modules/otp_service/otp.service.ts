import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { Resend } from 'resend'
import * as nodemailer from 'nodemailer'
import { randomInt } from 'crypto'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { EmailOtp } from './entities/email-otp.entity'
import { User } from '../users/user.entity'

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(EmailOtp) private readonly otpRepo: Repository<EmailOtp>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  private transporter = process.env.MAIL_USER && process.env.MAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      })
    : null

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (this.resend) {
      const from = process.env.MAIL_FROM || 'noreply@talktodoc.online'
      const result = await this.resend.emails.send({ from, to, subject, html })
      if ((result as any).error) {
        throw new Error((result as any).error.message || 'Resend send failed')
      }
      return
    }
    if (this.transporter) {
      const from = process.env.MAIL_FROM || process.env.MAIL_USER as string
      await this.transporter.sendMail({ from, to, subject, html })
      return
    }
    // Fallback to axios if no SDK/transport available
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: process.env.MAIL_FROM || 'noreply@talktodoc.online', to, subject, html }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Resend HTTP error ${res.status}: ${body}`)
      }
      return
    }
    throw new InternalServerErrorException('Email service is not configured')
  }

  private async isEmailTaken(email: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { email } })
    return !!user
  }

  async sendOtp(email: string) {
    if (await this.isEmailTaken(email)) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống')
    }

    const existingOtp = await this.otpRepo.findOne({ where: { email } })

    if (existingOtp) {
      if (existingOtp.isVerified) {
        throw new BadRequestException('Email đã được xác thực')
      }

      if (existingOtp.expiresAt > new Date()) {
        throw new BadRequestException('OTP vẫn còn hiệu lực, vui lòng kiểm tra email của bạn')
      }
    }

    const otp = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const record = await this.otpRepo.findOne({ where: { email } })
    if (record) {
      record.otp = otp
      record.expiresAt = expiresAt
      record.isVerified = false
      await this.otpRepo.save(record)
    } else {
      await this.otpRepo.save(this.otpRepo.create({ email, otp, expiresAt, isVerified: false }))
    }

    try {
      await this.sendEmail(
        email,
        'Mã xác thực OTP - TalkToDoc',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #2E86C1;">Xác thực đăng ký tài khoản</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi đã nhận được yêu cầu xác minh địa chỉ email của bạn trên <strong>TalkToDoc</strong>.</p>
            <p style="font-size: 18px;">Mã OTP của bạn là:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${otp}</div>
            <p>Mã này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
            <hr />
            <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} TalkToDoc. All rights reserved.</p>
          </div>
        `,
      )
    } catch (error) {
      console.error('Gửi email OTP thất bại:', (error as Error).message)
      throw new InternalServerErrorException('Không thể gửi OTP, vui lòng thử lại sau')
    }

    return { message: 'OTP mới đã được gửi đến email của bạn' }
  }

  async sendPasswordResetOtp(email: string): Promise<any> {
    // Yêu cầu email phải tồn tại trong hệ thống
    if (!(await this.isEmailTaken(email))) {
      throw new BadRequestException('Email không tồn tại trong hệ thống')
    }

    const existingOtp = await this.otpRepo.findOne({ where: { email } })

    if (existingOtp && existingOtp.expiresAt > new Date()) {
      await this.otpRepo.delete({ email })
    }

    const otp = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const reset = await this.otpRepo.findOne({ where: { email } })
    if (reset) {
      reset.otp = otp
      reset.expiresAt = expiresAt
      reset.isVerified = false
      await this.otpRepo.save(reset)
    } else {
      await this.otpRepo.save(this.otpRepo.create({ email, otp, expiresAt, isVerified: false }))
    }

    try {
      await this.sendEmail(
        email,
        'Mã xác thực đặt lại mật khẩu - TalkToDoc',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #2E86C1;">Đặt lại mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên <strong>TalkToDoc</strong>.</p>
            <p style="font-size: 18px;">Mã OTP của bạn là:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${otp}</div>
            <p>Mã này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và bảo vệ tài khoản của bạn.</p>
            <hr />
            <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} TalkToDoc. All rights reserved.</p>
          </div>
        `,
      )
    } catch (error) {
      console.error('Gửi email OTP thất bại:', (error as Error).message)
      throw new InternalServerErrorException('Không thể gửi OTP, vui lòng thử lại sau')
    }

    return { message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn' }
  }

  async verifyOtp(email: string, otp: string) {
    const record = await this.otpRepo.findOne({ where: { email, otp } })

    if (!record) throw new BadRequestException('OTP không hợp lệ')
    if (record.isVerified) throw new BadRequestException('OTP đã được sử dụng')
    if (record.expiresAt < new Date()) throw new BadRequestException('OTP đã hết hạn')

    record.isVerified = true
    await this.otpRepo.save(record)

    return { message: 'OTP đã được xác thực thành công', status: 200 }
  }
}
