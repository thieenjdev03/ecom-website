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
import {
  renderMingoEmail,
  mingoOtpBlock,
  mingoBrandFromEnv,
  MINGO,
  MINGO_FONT,
} from '../../common/email/mingo-email'

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(EmailOtp) private readonly otpRepo: Repository<EmailOtp>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  private brand = mingoBrandFromEnv()

  /** Dựng email OTP theo layout Mingo dùng chung. Hết hạn 5 phút (khớp logic). */
  private buildOtpEmail(opts: { label: string; heading: string; intro: string; otp: string }): string {
    const content = `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${MINGO.orange};font-weight:700;text-align:center;">${opts.label}</p>
      <h1 style="margin:0 0 14px;font-family:${MINGO_FONT};font-size:26px;font-weight:800;color:${MINGO.brown};text-align:center;">${opts.heading}</h1>
      <p style="margin:0;color:${MINGO.brown};text-align:center;">${opts.intro}</p>
      ${mingoOtpBlock(opts.otp)}
      <p style="margin:0;color:${MINGO.muted};font-size:14px;text-align:center;">Mã có hiệu lực trong <strong>5 phút</strong> và chỉ dùng được một lần.</p>
      <p style="margin:18px 0 0;color:${MINGO.muted};font-size:13px;text-align:center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
    `
    return renderMingoEmail(this.brand, {
      title: `${opts.heading} - ${this.brand.brandName}`,
      preheader: `Mã xác thực của bạn: ${opts.otp}`,
      content,
    })
  }

  private transporter = process.env.MAIL_USER && process.env.MAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      })
    : null

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    let lastError: Error | null = null

    // 1) Try Resend SDK first (if configured). On failure, fall through to the
    //    other transports instead of aborting — e.g. an unverified sender domain.
    if (this.resend) {
      try {
        const from = process.env.MAIL_FROM || 'noreply@kemmingo.com'
        const result = await this.resend.emails.send({ from, to, subject, html })
        if ((result as any).error) {
          throw new Error((result as any).error.message || 'Resend send failed')
        }
        return
      } catch (error) {
        lastError = error as Error
        console.warn('Resend gửi thất bại, thử phương thức dự phòng:', lastError.message)
      }
    }

    // 2) Fall back to SMTP/Gmail via nodemailer (if configured).
    if (this.transporter) {
      try {
        const from = process.env.MAIL_FROM || (process.env.MAIL_USER as string)
        await this.transporter.sendMail({ from, to, subject, html })
        return
      } catch (error) {
        lastError = error as Error
        console.warn('Nodemailer gửi thất bại:', lastError.message)
      }
    }

    // 3) Last resort: call the Resend HTTP API directly (covers SDK-less setups).
    if (process.env.RESEND_API_KEY) {
      try {
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
      } catch (error) {
        lastError = error as Error
        console.warn('Resend HTTP API gửi thất bại:', lastError.message)
      }
    }

    if (lastError) throw lastError
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
        `Mã xác thực tài khoản - ${this.brand.brandName}`,
        this.buildOtpEmail({
          label: 'Xác thực email',
          heading: 'Chào mừng đến với Mingo!',
          intro: 'Dùng mã bên dưới để hoàn tất xác thực email và kích hoạt tài khoản của bạn.',
          otp,
        }),
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
        `Mã đặt lại mật khẩu - ${this.brand.brandName}`,
        this.buildOtpEmail({
          label: 'Đặt lại mật khẩu',
          heading: 'Yêu cầu đặt lại mật khẩu',
          intro: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhập mã bên dưới để tiếp tục.',
          otp,
        }),
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
        `Mã đăng nhập - ${this.brand.brandName}`,
        this.buildOtpEmail({
          label: 'Đăng nhập',
          heading: 'Mã đăng nhập của bạn',
          intro: 'Dùng mã bên dưới để đăng nhập vào tài khoản Mingo của bạn.',
          otp,
        }),
      )
    } catch (error) {
      console.error('Gửi email OTP thất bại:', (error as Error).message)
      throw new InternalServerErrorException('Không thể gửi OTP, vui lòng thử lại sau')
    }

    return { message: 'Mã OTP đăng nhập đã được gửi đến email của bạn' }
  }

  /**
   * Đặt lại mật khẩu bằng OTP đã gửi qua sendPasswordResetOtp. Một lần gọi = xác thực OTP
   * + đổi mật khẩu, nên KHÔNG dùng verifyOtp cho luồng này (verifyOtp tự tạo tài khoản mới).
   */
  async resetPassword(email: string, otp: string, newPassword: string) {
    const record = await this.otpRepo.findOne({ where: { email, otp } })

    if (!record) throw new BadRequestException('OTP không hợp lệ')
    if (record.isVerified) throw new BadRequestException('OTP đã được sử dụng')
    if (record.expiresAt < new Date()) throw new BadRequestException('OTP đã hết hạn')

    const user = await this.userRepo.findOne({ where: { email } })
    if (!user) throw new BadRequestException('Email không tồn tại trong hệ thống')

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    await this.userRepo.save(user)

    // OTP chỉ dùng được một lần.
    record.isVerified = true
    await this.otpRepo.save(record)

    return { message: 'Đặt lại mật khẩu thành công', status: 200 }
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
