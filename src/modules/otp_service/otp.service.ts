import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { Resend } from 'resend'
import * as nodemailer from 'nodemailer'
import { randomInt } from 'crypto'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { EmailOtp } from './entities/email-otp.entity'
import { User } from '../users/user.entity'
import * as bcrypt from 'bcrypt'
import { Role } from '../../auth/enums/role.enum'

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
        'Mã xác thực OTP - Ecom Server',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; text-align: center; background-color: #ffffff;">
            <!-- Logo -->
            <div style="margin-bottom: 30px;">
              <h1 style="font-family: 'Brush Script MT', cursive; font-size: 36px; color: #000; margin: 0; letter-spacing: 2px;">
                LUMÉ
                <span style="font-size: 20px; color: #666;">✦</span>
              </h1>
            </div>
            
            <!-- OTP Code -->
            <div style="margin: 30px 0;">
              <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Your verification code:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000; margin: 20px 0;">${otp}</div>
              <p style="font-size: 14px; color: #666;">This code can only be used once. It expires in 15 minutes.</p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; margin: 0;">© LUMÉ</p>
              <div style="margin-top: 10px;">
                <a href="#" style="color: #007bff; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy policy</a>
                <a href="#" style="color: #007bff; text-decoration: none; font-size: 12px; margin: 0 10px;">Terms of service</a>
              </div>
            </div>
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
        'Mã xác thực đặt lại mật khẩu - Ecom Server',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; text-align: center; background-color: #ffffff;">
            <!-- Logo -->
            <div style="margin-bottom: 30px;">
              <h1 style="font-family: 'Brush Script MT', cursive; font-size: 36px; color: #000; margin: 0; letter-spacing: 2px;">
                LUMÉ
                <span style="font-size: 20px; color: #666;">✦</span>
              </h1>
            </div>
            
            <!-- OTP Code -->
            <div style="margin: 30px 0;">
              <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Your verification code:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000; margin: 20px 0;">${otp}</div>
              <p style="font-size: 14px; color: #666;">This code can only be used once. It expires in 15 minutes.</p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; margin: 0;">© LUMÉ</p>
              <div style="margin-top: 10px;">
                <a href="#" style="color: #007bff; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy policy</a>
                <a href="#" style="color: #007bff; text-decoration: none; font-size: 12px; margin: 0 10px;">Terms of service</a>
              </div>
            </div>
          </div>
        `,
      )
    } catch (error) {
      console.error('Gửi email OTP thất bại:', (error as Error).message)
      throw new InternalServerErrorException('Không thể gửi OTP, vui lòng thử lại sau')
    }

    return { message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn' }
  }

  async sendLoginOtp(email: string): Promise<any> {
    if (!(await this.isEmailTaken(email))) {
      throw new BadRequestException('Email không tồn tại trong hệ thống')
    }

    const existingOtp = await this.otpRepo.findOne({ where: { email } })

    if (existingOtp && existingOtp.expiresAt > new Date()) {
      await this.otpRepo.delete({ email })
    }

    const otp = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const login = await this.otpRepo.findOne({ where: { email } })
    if (login) {
      login.otp = otp
      login.expiresAt = expiresAt
      login.isVerified = false
      await this.otpRepo.save(login)
    } else {
      await this.otpRepo.save(this.otpRepo.create({ email, otp, expiresAt, isVerified: false }))
    }

    try {
      await this.sendEmail(
        email,
        'Verification code - LUMÉ',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; text-align: center; background-color: #ffffff;">
            <!-- Logo -->
            <div style="margin-bottom: 30px;">
              <h1 style="font-family: 'Brush Script MT', cursive; font-size: 36px; color: #000; margin: 0; letter-spacing: 2px;">
                LUMÉ
                <span style="font-size: 20px; color: #666;">✦</span>
              </h1>
            </div>
            
            <!-- OTP Code -->
            <div style="margin: 30px 0;">
              <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Your verification code:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000; margin: 20px 0;">${otp}</div>
              <p style="font-size: 14px; color: #666;">This code can only be used once. It expires in 15 minutes.</p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; margin: 0;">© LUMÉ</p>
              <div style="margin-top: 10px;">
                <a href="#" style="color: #007bff; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy policy</a>
                <a href="#" style="color: #007bff; text-decoration: none; font-size: 12px; margin: 0 10px;">Terms of service</a>
              </div>
            </div>
          </div>
        `,
      )
    } catch (error) {
      console.error('Gửi email OTP thất bại:', (error as Error).message)
      throw new InternalServerErrorException('Không thể gửi OTP, vui lòng thử lại sau')
    }

    return { message: 'Mã OTP đăng nhập đã được gửi đến email của bạn' }
  }

  async verifyOtp(email: string, otp: string) {
    const record = await this.otpRepo.findOne({ where: { email, otp } })

    if (!record) throw new BadRequestException('OTP không hợp lệ')
    if (record.isVerified) throw new BadRequestException('OTP đã được sử dụng')
    if (record.expiresAt < new Date()) throw new BadRequestException('OTP đã hết hạn')

    record.isVerified = true
    await this.otpRepo.save(record)

    // Auto-create account after successful verification (registration flow)
    let user = await this.userRepo.findOne({ where: { email } })
    if (!user) {
      const randomPassword = `${email}:${Date.now()}:${randomInt(100000, 999999)}`
      const passwordHash = await bcrypt.hash(randomPassword, 12)
      user = this.userRepo.create({ email, passwordHash, role: Role.USER })
      await this.userRepo.save(user)
    }

    return { message: 'OTP đã được xác thực thành công', status: 200 }
  }
}
